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
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="auth-brand-icon">B</div>
          <h1>Set new password</h1>
          <p>Choose a strong password for your account</p>
        </div>

        <div className="auth-card">
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
