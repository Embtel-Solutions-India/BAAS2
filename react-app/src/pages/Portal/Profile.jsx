import { useEffect, useState } from 'react';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatDate } from '../../utils/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [pwData, setPwData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [loading, setLoading] = useState(true);
  const [profileAlert, setProfileAlert] = useState({ type: '', text: '' });
  const [pwAlert, setPwAlert] = useState({ type: '', text: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [pwErrors, setPwErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const me = await api.get('/auth/me');
        setUser(me.user);
        
        let initialPhone = '';
        try {
          const prof = await api.get('/profile');
          initialPhone = prof.profile?.phone || '';
        } catch {}

        setProfileData({
          first_name: me.user.first_name || '',
          last_name: me.user.last_name || '',
          phone: initialPhone
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePwChange = (e) => {
    setPwData({ ...pwData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileAlert({ type: '', text: '' });

    let valid = true;
    const errors = {};
    if (!profileData.first_name.trim()) {
      errors.first_name = 'Required';
      valid = false;
    }
    if (!profileData.last_name.trim()) {
      errors.last_name = 'Required';
      valid = false;
    }
    if (!valid) {
      setProfileErrors(errors);
      return;
    }

    setProfileLoading(true);
    try {
      await api.put('/profile', {
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        phone: profileData.phone.trim() || undefined
      });
      setProfileAlert({ type: 'success', text: 'Profile updated successfully.' });
      
      // Update local user state header/avatar values
      setUser(prev => ({
        ...prev,
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim()
      }));
    } catch (err) {
      setProfileAlert({ type: 'danger', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setPwAlert({ type: '', text: '' });

    let valid = true;
    const errors = {};
    if (!pwData.current_password) {
      errors.current_password = 'Required';
      valid = false;
    }
    if (!pwData.new_password) {
      errors.new_password = 'Required';
      valid = false;
    } else if (pwData.new_password.length < 8) {
      errors.new_password = 'Min. 8 characters';
      valid = false;
    }
    if (pwData.new_password && pwData.confirm_new_password && pwData.new_password !== pwData.confirm_new_password) {
      errors.confirm_new_password = 'Passwords do not match';
      valid = false;
    }
    if (!valid) {
      setPwErrors(errors);
      return;
    }

    setPwLoading(true);
    try {
      await api.post('/profile/change-password', {
        current_password: pwData.current_password,
        new_password: pwData.new_password
      });
      setPwAlert({ type: 'success', text: 'Password updated successfully.' });
      setPwData({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
    } catch (err) {
      setPwAlert({ type: 'danger', text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
        </div>
      </PortalLayout>
    );
  }

  const avatarLetters = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase();

  return (
    <PortalLayout title="My Profile" subtitle="Manage your account details">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight sm:text-2xl">My Profile</h1>
      </div>

      <div className="max-w-2xl w-full flex flex-col gap-6">
        {/* Profile info card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4001f] to-[#a4001a] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-xs shrink-0">
              {avatarLetters || '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{user?.first_name} {user?.last_name}</h2>
              <div className="text-sm text-gray-500 mt-0.5">{user?.email}</div>
              <div className="mt-2.5">
                {user?.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                    Verified ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50 animate-pulse">
                    Email not verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {profileAlert.text && (
            <div className={`p-4 rounded-lg text-sm mb-5 font-semibold ${profileAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/30' : 'bg-rose-50 text-rose-800 border border-rose-200/30'}`}>
              {profileAlert.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2" htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm transition-all bg-white focus:ring-3 ${profileErrors.first_name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  required
                />
                {profileErrors.first_name && <div className="text-xs font-semibold text-rose-600 mt-1.5">{profileErrors.first_name}</div>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2" htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm transition-all bg-white focus:ring-3 ${profileErrors.last_name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                  required
                />
                {profileErrors.last_name && <div className="text-xs font-semibold text-rose-600 mt-1.5">{profileErrors.last_name}</div>}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-100 text-sm bg-gray-50/50 text-gray-400 cursor-not-allowed"
                disabled
                value={user?.email || ''}
              />
              <div className="text-xs text-gray-400 mt-2 leading-relaxed">
                Email address cannot be changed. Contact support if needed.
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2" htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-sm transition-all bg-white"
                placeholder="(555) 000-0000"
                value={profileData.phone}
                onChange={handleProfileChange}
              />
            </div>

            <button 
              type="submit" 
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white rounded-lg text-sm font-semibold shadow-xs shadow-rose-950/10 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={profileLoading}
            >
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1">Change Password</h3>
          <p className="text-xs text-gray-400 mb-5 leading-relaxed">Use a strong password that you don't use elsewhere.</p>

          {pwAlert.text && (
            <div className={`p-4 rounded-lg text-sm mb-5 font-semibold ${pwAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/30' : 'bg-rose-50 text-rose-800 border border-rose-200/30'}`}>
              {pwAlert.text}
            </div>
          )}

          <form onSubmit={handlePwSubmit} noValidate>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2" htmlFor="current_password">Current Password</label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm transition-all bg-white focus:ring-3 ${pwErrors.current_password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                value={pwData.current_password}
                onChange={handlePwChange}
                required
              />
              {pwErrors.current_password && <div className="text-xs font-semibold text-rose-600 mt-1.5">{pwErrors.current_password}</div>}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2" htmlFor="new_password">New Password</label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm transition-all bg-white focus:ring-3 ${pwErrors.new_password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                placeholder="Min. 8 characters"
                value={pwData.new_password}
                onChange={handlePwChange}
                required
              />
              {pwErrors.new_password && <div className="text-xs font-semibold text-rose-600 mt-1.5">{pwErrors.new_password}</div>}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2" htmlFor="confirm_new_password">Confirm New Password</label>
              <input
                type="password"
                id="confirm_new_password"
                name="confirm_new_password"
                className={`w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm transition-all bg-white focus:ring-3 ${pwErrors.confirm_new_password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                value={pwData.confirm_new_password}
                onChange={handlePwChange}
                required
              />
              {pwErrors.confirm_new_password && <div className="text-xs font-semibold text-rose-600 mt-1.5">{pwErrors.confirm_new_password}</div>}
            </div>

            <button 
              type="submit" 
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white rounded-lg text-sm font-semibold shadow-xs shadow-rose-950/10 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pwLoading}
            >
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Account Info</h4>
          <div className="text-sm text-gray-500">
            Member since:{' '}
            <span className="text-gray-900 font-semibold">{formatDate(user?.created_at)}</span>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

