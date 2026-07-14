import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import PasswordInput from '../../components/UI/PasswordInput';
import '../../styles/portal.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await api.get('/auth/me');
        if (data?.user?.role && data.user.role !== 'client') {
          navigate('/admin/dashboard');
        }
      } catch {}
    }
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailErr('');
    setPasswordErr('');
    setAlertMsg('');

    let valid = true;
    if (!email.trim()) {
      setEmailErr('Required');
      valid = false;
    }
    if (!password) {
      setPasswordErr('Required');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email: email.trim(), password });
      if (!data.user || data.user.role === 'client') {
        setAlertMsg('Access denied. Admin accounts only.');
        setLoading(false);
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setAlertMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-6 sm:p-10 select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-900/[0.08] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#d4001f] to-[#a4001a] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-[#d4001f]/20 tracking-tight font-serif mb-3">
            B
          </div>
          <h1 className="text-base font-extrabold text-white tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Bay Area Accounting Solutions</p>
        </div>

        {/* Auth form card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col gap-4">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/[0.08] text-rose-400 border border-rose-500/15 text-[10px] font-bold uppercase tracking-wider">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              Staff Access Only
            </span>
          </div>

          {alertMsg && (
            <div className="p-3.5 rounded-lg bg-rose-950/20 text-rose-400 border border-rose-900/30 text-xs font-semibold">
              {alertMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className={`w-full px-3.5 py-2.5 rounded-lg border focus:ring-3 outline-none text-xs transition-all bg-slate-950 text-white placeholder-slate-700 ${emailErr ? 'border-rose-900 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-800 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {emailErr && <div className="text-xs text-rose-500 font-semibold mt-1.5">{emailErr}</div>}
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <PasswordInput
                id="password"
                className={`w-full px-3.5 py-2.5 rounded-lg border focus:ring-3 outline-none text-xs transition-all bg-slate-950 text-white placeholder-slate-700 ${passwordErr ? 'border-rose-900 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-800 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {passwordErr && <div className="text-xs text-rose-500 font-semibold mt-1.5">{passwordErr}</div>}
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-bold rounded-lg shadow-lg shadow-rose-900/20 hover:shadow-rose-900/30 transition-all duration-300 mt-2 cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

