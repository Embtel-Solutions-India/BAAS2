import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../hooks/usePortal';
import { api, API_BASE } from '../../utils/api';
import PasswordInput from '../UI/PasswordInput';
import OtpInput from '../UI/OtpInput';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 23 23" width="16" height="16" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" /><path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" /><path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}

export default function PortalModal() {
  const { isOpen, close, activeTab, setActiveTab } = usePortal();
  const navigate = useNavigate();

  const [methods, setMethods] = useState({ providers: {} });
  useEffect(() => { api.get('/auth/methods').then(setMethods).catch(() => {}); }, []);
  const goOAuth = (p) => { window.location.href = `${API_BASE}/auth/oauth/${p}`; };

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

  // Register OTP verification step
  const [regStep, setRegStep] = useState('form');   // 'form' | 'otp'
  const [regOtp, setRegOtp] = useState('');
  const [regOtpMsg, setRegOtpMsg] = useState('');
  const [regOtpLoading, setRegOtpLoading] = useState(false);
  const [regResendIn, setRegResendIn] = useState(0);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [close]);

  useEffect(() => {
    if (regResendIn <= 0) return;
    const t = setInterval(() => setRegResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [regResendIn]);

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

  // Step 1 — validate the form, then email a verification code.
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
      const r = await api.post('/auth/register/send-otp', { email: email.trim() });
      setRegStep('otp');
      setRegOtp('');
      setRegError('');
      setRegResendIn(r.resendInSec || 60);
      setRegOtpMsg(r.emailed
        ? `We emailed a 6-digit code to ${email.trim()}.`
        : (r.devCode ? `Dev mode: your code is ${r.devCode}` : 'A verification code has been generated.'));
    } catch (err) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  const resendRegOtp = async () => {
    setRegError(''); setRegOtpMsg('');
    setRegOtpLoading(true);
    try {
      const r = await api.post('/auth/register/resend-otp', { email: regData.email.trim() });
      setRegResendIn(r.resendInSec || 60);
      setRegOtpMsg(r.emailed
        ? `A new code was sent to ${regData.email.trim()}.`
        : (r.devCode ? `Dev mode: your code is ${r.devCode}` : 'A new code has been generated.'));
    } catch (err) {
      setRegError(err.message || 'Failed to resend code');
      if (err.retryAfter) setRegResendIn(err.retryAfter);
    } finally {
      setRegOtpLoading(false);
    }
  };

  // Step 2 — verify the code; the account is created only on success.
  const verifyRegOtp = async (code) => {
    const c = (code || regOtp).trim();
    if (c.length < 6) { setRegError('Enter the 6-digit code.'); return; }
    setRegError(''); setRegOtpLoading(true);
    const { first_name, last_name, email, password, phone, company_name } = regData;
    try {
      const data = await api.post('/auth/register/verify', {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company_name: company_name.trim(),
        password,
        code: c,
      });
      close();
      navigate(data?.user?.role === 'client' ? '/client-portal/dashboard' : '/admin/dashboard');
    } catch (err) {
      setRegError(err.message || 'Verification failed');
      setRegOtpLoading(false);
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
            <h3 className="serif" id="modalTitle">{activeTab === 'register' ? (regStep === 'otp' ? 'Verify your email' : 'Create Account') : 'Welcome Back'}</h3>
          </div>
          <button className="modal-close" onClick={close} aria-label="Close portal">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div id="authView">
            <div className="tab-switch">
              <button className={`tab-btn${activeTab === 'login' ? ' active' : ''}`} onClick={() => { setActiveTab('login'); setRegStep('form'); }}>Sign In</button>
              <button className={`tab-btn${activeTab === 'register' ? ' active' : ''}`} onClick={() => setActiveTab('register')}>Register</button>
            </div>

            {(methods.providers?.google || methods.providers?.microsoft) && !(activeTab === 'register' && regStep === 'otp') && (
              <div style={{marginBottom:'20px'}}>
                {methods.providers?.google && (
                  <button type="button" className="btn-ol" style={{width:'100%',justifyContent:'center',gap:'10px',marginBottom:'10px'}} onClick={() => goOAuth('google')}>
                    <GoogleIcon /> Continue with Google
                  </button>
                )}
                {methods.providers?.microsoft && (
                  <button type="button" className="btn-ol" style={{width:'100%',justifyContent:'center',gap:'10px'}} onClick={() => goOAuth('microsoft')}>
                    <MicrosoftIcon /> Continue with Microsoft
                  </button>
                )}
                <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'18px 0 4px',color:'var(--td)',fontSize:'13px'}}>
                  <span style={{flex:1,height:'1px',background:'var(--border)'}} />
                  or {activeTab === 'register' ? 'sign up' : 'sign in'} with email
                  <span style={{flex:1,height:'1px',background:'var(--border)'}} />
                </div>
              </div>
            )}

            {activeTab === 'login' && (
              <div>
                {loginError && <div style={{background:'rgba(212,0,31,.08)',color:'var(--accent)',padding:'10px 14px',borderRadius:'8px',fontSize:'14px',marginBottom:'16px'}}>{loginError}</div>}
                <div className="form-group"><label>Email Address</label><input type="email" className="form-input" placeholder="you@company.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}/></div>
                <div className="form-group" style={{marginBottom:'8px'}}><label>Password</label><PasswordInput className="form-input" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}/></div>
                <div style={{textAlign:'right',marginBottom:'24px'}}><a href="/client-portal/forgot-password" style={{fontSize:'14px',color:'var(--accent)'}}>Forgot password?</a></div>
                <button className="form-submit" onClick={handleLogin} disabled={loginLoading}>{loginLoading ? 'Signing in…' : 'Sign In to Portal'}</button>
              </div>
            )}

            {activeTab === 'register' && regStep === 'form' && (
              <div>
                {regError && <div style={{background:'rgba(212,0,31,.08)',color:'var(--accent)',padding:'10px 14px',borderRadius:'8px',fontSize:'14px',marginBottom:'16px'}}>{regError}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                  <div className="form-group" style={{margin:0}}><label>First Name</label><input type="text" name="first_name" className="form-input" placeholder="John" value={regData.first_name} onChange={handleRegChange}/></div>
                  <div className="form-group" style={{margin:0}}><label>Last Name</label><input type="text" name="last_name" className="form-input" placeholder="Doe" value={regData.last_name} onChange={handleRegChange}/></div>
                </div>
                <div className="form-group"><label>Company Name</label><input type="text" name="company_name" className="form-input" placeholder="Your Company LLC" value={regData.company_name} onChange={handleRegChange}/></div>
                <div className="form-group"><label>Email Address</label><input type="email" name="email" className="form-input" placeholder="you@company.com" value={regData.email} onChange={handleRegChange}/></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" name="phone" className="form-input" placeholder="(555) 000-0000" value={regData.phone} onChange={handleRegChange}/></div>
                <div className="form-group" style={{marginBottom:'24px'}}><label>Create Password</label><PasswordInput name="password" className="form-input" placeholder="Min. 8 characters" value={regData.password} onChange={handleRegChange} onKeyDown={e => e.key === 'Enter' && handleRegister()}/></div>
                <button className="form-submit" onClick={handleRegister} disabled={regLoading}>{regLoading ? 'Sending code…' : 'Continue'}</button>
              </div>
            )}

            {activeTab === 'register' && regStep === 'otp' && (
              <div>
                {regOtpMsg && <div style={{background:'rgba(16,120,60,.08)',color:'#0a7a3d',padding:'10px 14px',borderRadius:'8px',fontSize:'14px',marginBottom:'16px'}}>{regOtpMsg}</div>}
                {regError && <div style={{background:'rgba(212,0,31,.08)',color:'var(--accent)',padding:'10px 14px',borderRadius:'8px',fontSize:'14px',marginBottom:'16px'}}>{regError}</div>}
                <label style={{display:'block',fontSize:'14px',fontWeight:600,marginBottom:'10px',textAlign:'center'}}>Enter the 6-digit code sent to {regData.email.trim()}</label>
                <OtpInput value={regOtp} onChange={setRegOtp} onComplete={verifyRegOtp} disabled={regOtpLoading} />
                <button className="form-submit" style={{marginTop:'18px'}} onClick={() => verifyRegOtp()} disabled={regOtpLoading || regOtp.length < 6}>{regOtpLoading ? 'Verifying…' : 'Verify & Create Account'}</button>
                <div style={{textAlign:'center',marginTop:'12px',fontSize:'13px',color:'var(--td)'}}>
                  {regResendIn > 0
                    ? <span>Resend code in {regResendIn}s</span>
                    : <button type="button" onClick={resendRegOtp} disabled={regOtpLoading} style={{background:'none',border:'none',color:'var(--accent)',fontWeight:600,cursor:'pointer'}}>Resend code</button>}
                  <span style={{margin:'0 8px'}}>·</span>
                  <button type="button" onClick={() => { setRegStep('form'); setRegOtp(''); setRegError(''); setRegOtpMsg(''); }} style={{background:'none',border:'none',color:'var(--accent)',fontWeight:600,cursor:'pointer'}}>Edit details</button>
                </div>
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
