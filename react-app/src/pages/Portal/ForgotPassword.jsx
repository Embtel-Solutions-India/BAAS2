import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/portal.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailErr('');
    setAlertMsg('');
    setAlertType('');

    if (!email.trim()) {
      setEmailErr('Email is required');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email: email.trim() });
      setAlertType('success');
      setAlertMsg(data.message || 'If that email exists in our system, we have sent a password reset link.');
      setSuccess(true);
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="auth-brand-icon">B</div>
          <h1>Reset your password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        <div className="auth-card">
          {alertMsg && <div className={`alert alert-${alertType}`} style={{ marginBottom: '16px' }}>{alertMsg}</div>}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className={`form-control ${emailErr ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <div className={`form-error ${emailErr ? 'visible' : ''}`}>{emailErr}</div>
              </div>

              <button type="submit" className="btn-pl" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
            <Link to="/client-portal/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
