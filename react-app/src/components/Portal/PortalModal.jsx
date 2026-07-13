import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../hooks/usePortal';
import { api } from '../../utils/api';

export default function PortalModal() {
  const { isOpen, close, activeTab, setActiveTab } = usePortal();
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regData, setRegData] = useState({
    first_name: '', last_name: '', company_name: '',
    email: '', phone: '', password: ''
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [close]);

  const handleLogin = async () => {
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please fill in all fields');
      return;
    }
    setLoginLoading(true);
    try {
      const data = await api.post('/auth/login', { email: loginEmail.trim(), password: loginPassword });
      close();
      if (data?.user?.role === 'client') {
        navigate('/client-portal/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed');
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    const { first_name, last_name, email, password, phone, company_name } = regData;
    if (!first_name || !last_name || !email || !password || !phone || !company_name) {
      setRegError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setRegError('Password must be at least 8 characters');
      return;
    }
    setRegLoading(true);
    try {
      const data = await api.post('/auth/register', {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company_name: company_name.trim(),
        password
      });
      close();
      if (data?.user?.role === 'client') {
        navigate('/client-portal/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setRegError(err.message || 'Registration failed');
      setRegLoading(false);
    }
  };

  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} id="portalModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div className="modal-backdrop" onClick={close} />
      <div className="modal">
        <div className="modal-header">
          <div>
            <div style={{fontSize:'13px',color:'var(--accent)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:'6px'}}>Client Portal</div>
            <h3 className="serif" id="modalTitle">{activeTab === 'register' ? 'Create Account' : 'Welcome Back'}</h3>
          </div>
          <button className="modal-close" onClick={close} aria-label="Close portal">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div id="authView">
            <div className="tab-switch">
              <button className={`tab-btn${activeTab === 'login' ? ' active' : ''}`} onClick={() => setActiveTab('login')}>Sign In</button>
              <button className={`tab-btn${activeTab === 'register' ? ' active' : ''}`} onClick={() => setActiveTab('register')}>Register</button>
            </div>

            {activeTab === 'login' && (
              <div>
                {loginError && <div style={{background:'rgba(212,0,31,.08)',color:'var(--accent)',padding:'10px 14px',borderRadius:'8px',fontSize:'14px',marginBottom:'16px'}}>{loginError}</div>}
                <div className="form-group"><label>Email Address</label><input type="email" className="form-input" placeholder="you@company.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}/></div>
                <div className="form-group" style={{marginBottom:'8px'}}><label>Password</label><input type="password" className="form-input" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}/></div>
                <div style={{textAlign:'right',marginBottom:'24px'}}><a href="/client-portal/forgot-password" style={{fontSize:'14px',color:'var(--accent)'}}>Forgot password?</a></div>
                <button className="form-submit" onClick={handleLogin} disabled={loginLoading}>{loginLoading ? 'Signing in…' : 'Sign In to Portal'}</button>
              </div>
            )}

            {activeTab === 'register' && (
              <div>
                {regError && <div style={{background:'rgba(212,0,31,.08)',color:'var(--accent)',padding:'10px 14px',borderRadius:'8px',fontSize:'14px',marginBottom:'16px'}}>{regError}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                  <div className="form-group" style={{margin:0}}><label>First Name</label><input type="text" name="first_name" className="form-input" placeholder="John" value={regData.first_name} onChange={handleRegChange}/></div>
                  <div className="form-group" style={{margin:0}}><label>Last Name</label><input type="text" name="last_name" className="form-input" placeholder="Doe" value={regData.last_name} onChange={handleRegChange}/></div>
                </div>
                <div className="form-group"><label>Company Name</label><input type="text" name="company_name" className="form-input" placeholder="Your Company LLC" value={regData.company_name} onChange={handleRegChange}/></div>
                <div className="form-group"><label>Email Address</label><input type="email" name="email" className="form-input" placeholder="you@company.com" value={regData.email} onChange={handleRegChange}/></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" name="phone" className="form-input" placeholder="(555) 000-0000" value={regData.phone} onChange={handleRegChange}/></div>
                <div className="form-group" style={{marginBottom:'24px'}}><label>Create Password</label><input type="password" name="password" className="form-input" placeholder="Min. 8 characters" value={regData.password} onChange={handleRegChange} onKeyDown={e => e.key === 'Enter' && handleRegister()}/></div>
                <button className="form-submit" onClick={handleRegister} disabled={regLoading}>{regLoading ? 'Creating account…' : 'Create Account'}</button>
              </div>
            )}

            <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'20px',justifyContent:'center'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--td)'}} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{fontSize:'13px',color:'rgba(0,0,0,0.45)'}}>256-bit SSL encrypted &bull; SOC 2 compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
