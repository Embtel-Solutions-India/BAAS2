import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, API_BASE } from '../../utils/api';
import PasswordInput from '../../components/UI/PasswordInput';
import OtpInput from '../../components/UI/OtpInput';
import '../../styles/portal.css';

const OAUTH_MESSAGES = {
  unavailable: 'That sign-in method isn’t available right now.',
  error: 'Something went wrong signing you in. Please try again.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  no_email: 'We couldn’t get an email from that account.',
};

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

export default function Login() {
  const navigate = useNavigate();

  // password flow
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // method discovery
  const [methods, setMethods] = useState({ otp: true, providers: {} });

  // OTP flow
  const [mode, setMode] = useState('password');   // 'password' | 'otp'
  const [otpStage, setOtpStage] = useState('email'); // 'email' | 'code'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/auth/me');
        if (data?.user) navigate(data.user.role === 'client' ? '/client-portal/dashboard' : '/admin/dashboard');
      } catch { /* not signed in */ }
    })();
    api.get('/auth/methods').then(setMethods).catch(() => {});
    const oauthErr = new URLSearchParams(window.location.search).get('oauth');
    if (oauthErr && OAUTH_MESSAGES[oauthErr]) setAlertMsg(OAUTH_MESSAGES[oauthErr]);
  }, [navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailErr(''); setPasswordErr(''); setAlertMsg('');
    let valid = true;
    if (!email.trim()) { setEmailErr('Email is required'); valid = false; }
    if (!password) { setPasswordErr('Password is required'); valid = false; }
    if (!valid) return;
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email: email.trim(), password });
      navigate(data?.user?.role === 'client' ? '/client-portal/dashboard' : '/admin/dashboard');
    } catch (err) {
      setAlertMsg(err.message);
      setLoading(false);
    }
  };

  const sendCode = async () => {
    setOtpErr(''); setOtpMsg('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(otpEmail.trim())) { setOtpErr('Please enter a valid email address.'); return; }
    setOtpLoading(true);
    try {
      const r = await api.post('/auth/otp/send', { email: otpEmail.trim() });
      setOtpStage('code');
      setOtpCode('');
      setResendIn(r.resendInSec || 60);
      setOtpMsg(r.emailed ? `We emailed a 6-digit code to ${otpEmail.trim()}.` : (r.devCode ? `Dev mode: your code is ${r.devCode}` : 'A code has been generated.'));
    } catch (err) {
      setOtpErr(err.message || 'Failed to send code');
      if (err.retryAfter) setResendIn(err.retryAfter);
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyCode = async (code) => {
    const c = (code || otpCode).trim();
    if (c.length < 6) { setOtpErr('Enter the 6-digit code.'); return; }
    setOtpErr(''); setOtpLoading(true);
    try {
      await api.post('/auth/otp/verify', { email: otpEmail.trim(), code: c });
      navigate('/client-portal/dashboard');
    } catch (err) {
      setOtpErr(err.message || 'Verification failed');
      setOtpLoading(false);
    }
  };

  const providers = methods.providers || {};
  const anyOAuth = providers.google || providers.microsoft;
  const goOAuth = (p) => { window.location.href = `${API_BASE}/auth/oauth/${p}`; };

  const oauthBtnStyle = { width: '100%', justifyContent: 'center', gap: '10px', marginBottom: '10px' };

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="auth-brand-icon">B</div>
          <h1>Welcome back</h1>
          <p>Sign in to your BAAS Client Portal</p>
        </div>

        <div className="auth-card">
          {alertMsg && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{alertMsg}</div>}

          {anyOAuth && (
            <>
              {providers.google && (
                <button type="button" className="btn-ol" style={oauthBtnStyle} onClick={() => goOAuth('google')}>
                  <GoogleIcon /> Continue with Google
                </button>
              )}
              {providers.microsoft && (
                <button type="button" className="btn-ol" style={oauthBtnStyle} onClick={() => goOAuth('microsoft')}>
                  <MicrosoftIcon /> Continue with Microsoft
                </button>
              )}
              <div className="divider">or</div>
            </>
          )}

          {mode === 'password' && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" className={`form-control ${emailErr ? 'error' : ''}`} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                <div className={`form-error ${emailErr ? 'visible' : ''}`}>{emailErr}</div>
              </div>
              <div className="form-group">
                <label htmlFor="password">
                  Password
                  <Link to="/client-portal/forgot-password" style={{ fontWeight: '400', color: 'var(--accent)', fontSize: '13px', float: 'right' }}>Forgot password?</Link>
                </label>
                <PasswordInput id="password" className={`form-control ${passwordErr ? 'error' : ''}`} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <div className={`form-error ${passwordErr ? 'visible' : ''}`}>{passwordErr}</div>
              </div>
              <button type="submit" className="btn-pl" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                {loading ? 'Loading…' : 'Sign In'}
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <div>
              {otpMsg && <div className="alert alert-info" style={{ marginBottom: '16px' }}>{otpMsg}</div>}
              {otpErr && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{otpErr}</div>}

              {otpStage === 'email' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="otpEmail">Email Address</label>
                    <input type="email" id="otpEmail" className="form-control" placeholder="you@example.com" value={otpEmail}
                      onChange={e => setOtpEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCode()} required />
                  </div>
                  <button type="button" className="btn-pl" disabled={otpLoading} onClick={sendCode} style={{ width: '100%', justifyContent: 'center' }}>
                    {otpLoading ? 'Sending…' : 'Email me a login code'}
                  </button>
                </>
              ) : (
                <>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>Enter the 6-digit code</label>
                  <OtpInput value={otpCode} onChange={setOtpCode} onComplete={verifyCode} disabled={otpLoading} />
                  <button type="button" className="btn-pl" disabled={otpLoading || otpCode.length < 6} onClick={() => verifyCode()} style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}>
                    {otpLoading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--td)' }}>
                    {resendIn > 0
                      ? <span>Resend code in {resendIn}s</span>
                      : <button type="button" onClick={sendCode} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Resend code</button>}
                    <span style={{ margin: '0 8px' }}>·</span>
                    <button type="button" onClick={() => { setOtpStage('email'); setOtpCode(''); setOtpErr(''); setOtpMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Change email</button>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
            {mode === 'password'
              ? <button type="button" onClick={() => { setMode('otp'); setOtpEmail(email); setAlertMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Email me a login code instead</button>
              : <button type="button" onClick={() => { setMode('password'); setOtpStage('email'); setOtpErr(''); setOtpMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Use password instead</button>}
          </div>

          <div className="divider">or</div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--td)' }}>
            Don't have an account?{' '}
            <Link to="/client-portal/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>Create one</Link>
          </div>
        </div>

        <div className="auth-footer">
          <Link to="/" style={{ color: 'var(--accent)', fontWeight: '600' }}>← Back to main website</Link>
        </div>
      </div>
    </div>
  );
}
