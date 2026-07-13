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
    <div style={{ background: '#f5f5f7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="auth-wrap" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="auth-brand" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="auth-brand-icon" style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: '700', color: '#fff',
            marginBottom: '14px'
          }}>B</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Reset your password</h1>
          <p style={{ fontSize: '14px', color: 'var(--td)' }}>Enter your email and we'll send you a reset link</p>
        </div>

        <div className="auth-card" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--cb)', padding: '32px', boxShadow: 'var(--shadow-md)' }}>
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
