import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/portal.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [confirmPasswordErr, setConfirmPasswordErr] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setAlertType('danger');
      setAlertMsg('Invalid reset link. Please request a new one.');
      setSuccess(true); // Hide form
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordErr('');
    setConfirmPasswordErr('');
    setAlertMsg('');
    setAlertType('');

    let valid = true;
    if (!password || password.length < 8) {
      setPasswordErr('Password must be at least 8 characters');
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordErr('Passwords do not match');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const data = await api.post('/auth/reset-password', { token, password });
      setAlertType('success');
      setAlertMsg(data.message || 'Password reset successfully!');
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
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Set new password</h1>
          <p style={{ fontSize: '14px', color: 'var(--td)' }}>Choose a strong password for your account</p>
        </div>

        <div className="auth-card" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--cb)', padding: '32px', boxShadow: 'var(--shadow-md)' }}>
          {alertMsg && (
            <div className={`alert alert-${alertType}`} style={{ marginBottom: '16px' }}>
              {alertType === 'success' ? (
                <span>
                  {alertMsg}{' '}
                  <Link to="/client-portal/login" style={{ fontWeight: '700', textDecoration: 'underline' }}>Sign in →</Link>
                </span>
              ) : (
                alertMsg
              )}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  className={`form-control ${passwordErr ? 'error' : ''}`}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <div className={`form-error ${passwordErr ? 'visible' : ''}`}>{passwordErr}</div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm_password"
                  className={`form-control ${confirmPasswordErr ? 'error' : ''}`}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <div className={`form-error ${confirmPasswordErr ? 'visible' : ''}`}>{confirmPasswordErr}</div>
              </div>

              <button type="submit" className="btn-pl" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Saving…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
