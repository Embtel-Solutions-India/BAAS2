import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, API_BASE } from '../../utils/api';
import PasswordInput from '../../components/UI/PasswordInput';
import OtpInput from '../../components/UI/OtpInput';
import '../../styles/portal.css';

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

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // sign-in method discovery (OAuth buttons appear when a provider is configured)
  const [methods, setMethods] = useState({ otp: true, providers: {} });

  // OTP verification step
  const [step, setStep] = useState('form');   // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    api.get('/auth/methods').then(setMethods).catch(() => {});
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const providers = methods.providers || {};
  const anyOAuth = providers.google || providers.microsoft;
  const goOAuth = (p) => { window.location.href = `${API_BASE}/auth/oauth/${p}`; };
  const oauthBtnStyle = { width: '100%', justifyContent: 'center', gap: '10px', marginBottom: '10px' };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    let valid = true;
    const required = ['first_name', 'last_name', 'email', 'phone', 'company_name', 'password', 'confirm_password'];
    required.forEach(f => {
      if (!formData[f].trim()) { newErrors[f] = 'This field is required'; valid = false; }
    });
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'; valid = false;
    }
    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'; valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  // Step 1 — validate form, then send a verification code to the email.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setAlertMsg('');
    if (!validate()) return;

    setLoading(true);
    try {
      const r = await api.post('/auth/register/send-otp', { email: formData.email.trim() });
      setStep('otp');
      setOtpCode('');
      setOtpErr('');
      setResendIn(r.resendInSec || 60);
      setOtpMsg(r.emailed
        ? `We emailed a 6-digit verification code to ${formData.email.trim()}.`
        : (r.devCode ? `Dev mode: your code is ${r.devCode}` : 'A verification code has been generated.'));
    } catch (err) {
      setAlertMsg(err.message || 'Could not start registration');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setOtpErr(''); setOtpMsg('');
    setOtpLoading(true);
    try {
      const r = await api.post('/auth/register/resend-otp', { email: formData.email.trim() });
      setResendIn(r.resendInSec || 60);
      setOtpMsg(r.emailed
        ? `A new code was sent to ${formData.email.trim()}.`
        : (r.devCode ? `Dev mode: your code is ${r.devCode}` : 'A new code has been generated.'));
    } catch (err) {
      setOtpErr(err.message || 'Failed to resend code');
      if (err.retryAfter) setResendIn(err.retryAfter);
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2 — verify the code; the account is created server-side only on success.
  const verifyCode = async (code) => {
    const c = (code || otpCode).trim();
    if (c.length < 6) { setOtpErr('Enter the 6-digit code.'); return; }
    setOtpErr(''); setOtpLoading(true);
    try {
      await api.post('/auth/register/verify', {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company_name: formData.company_name.trim(),
        password: formData.password,
        code: c,
      });
      navigate('/client-portal/dashboard');
    } catch (err) {
      setOtpErr(err.message || 'Verification failed');
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap" style={{ maxWidth: '460px' }}>
        <div className="auth-brand">
          <div className="auth-brand-icon">B</div>
          <h1>{step === 'otp' ? 'Verify your email' : 'Create your account'}</h1>
          <p>{step === 'otp' ? 'Enter the code we sent to confirm your email' : 'Get started with BAAS Client Portal'}</p>
        </div>

        <div className="auth-card">
          {alertMsg && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              {alertMsg}
            </div>
          )}

          {step === 'form' && anyOAuth && (
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
              <div className="divider">or sign up with email</div>
            </>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className={`form-control ${errors.first_name ? 'error' : ''}`}
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                  <div className={`form-error ${errors.first_name ? 'visible' : ''}`}>{errors.first_name}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className={`form-control ${errors.last_name ? 'error' : ''}`}
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                  <div className={`form-error ${errors.last_name ? 'visible' : ''}`}>{errors.last_name}</div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="company_name">Company Name</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  className={`form-control ${errors.company_name ? 'error' : ''}`}
                  placeholder="Your Company LLC"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                />
                <div className={`form-error ${errors.company_name ? 'visible' : ''}`}>{errors.company_name}</div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <div className={`form-error ${errors.email ? 'visible' : ''}`}>{errors.email}</div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                <div className={`form-error ${errors.phone ? 'visible' : ''}`}>{errors.phone}</div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <PasswordInput
                  id="password"
                  name="password"
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <div className={`form-error ${errors.password ? 'visible' : ''}`}>{errors.password}</div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm Password</label>
                <PasswordInput
                  id="confirm_password"
                  name="confirm_password"
                  className={`form-control ${errors.confirm_password ? 'error' : ''}`}
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
                <div className={`form-error ${errors.confirm_password ? 'visible' : ''}`}>{errors.confirm_password}</div>
              </div>

              <button type="submit" className="btn-pl" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                {loading ? 'Sending code…' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div>
              {otpMsg && <div className="alert alert-info" style={{ marginBottom: '16px' }}>{otpMsg}</div>}
              {otpErr && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{otpErr}</div>}

              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>
                Enter the 6-digit code
              </label>
              <OtpInput value={otpCode} onChange={setOtpCode} onComplete={verifyCode} disabled={otpLoading} />

              <button type="button" className="btn-pl" disabled={otpLoading || otpCode.length < 6} onClick={() => verifyCode()} style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}>
                {otpLoading ? 'Verifying…' : 'Verify & Create Account'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--td)' }}>
                {resendIn > 0
                  ? <span>Resend code in {resendIn}s</span>
                  : <button type="button" onClick={resendCode} disabled={otpLoading} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Resend code</button>}
                <span style={{ margin: '0 8px' }}>·</span>
                <button type="button" onClick={() => { setStep('form'); setOtpCode(''); setOtpErr(''); setOtpMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Edit details</button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--td)' }}>
            Already have an account?{' '}
            <Link to="/client-portal/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>
              Sign in
            </Link>
          </div>
        </div>

        <div className="auth-footer">
          <Link to="/" style={{ color: 'var(--accent)', fontWeight: '600' }}>← Back to main website</Link>
        </div>
      </div>
    </div>
  );
}
