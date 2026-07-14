import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import PasswordInput from '../../components/UI/PasswordInput';
import '../../styles/portal.css';

export default function Login() {
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
        if (data?.user) {
          if (data.user.role === 'client') {
            navigate('/client-portal/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
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
      setEmailErr('Email is required');
      valid = false;
    }
    if (!password) {
      setPasswordErr('Password is required');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email: email.trim(), password });
      if (data?.user?.role === 'client') {
        navigate('/client-portal/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setAlertMsg(err.message);
      setLoading(false);
    }
  };

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

            <div className="form-group">
              <label htmlFor="password">
                Password
                <Link to="/client-portal/forgot-password" style={{ fontWeight: '400', color: 'var(--accent)', fontSize: '13px', float: 'right' }}>
                  Forgot password?
                </Link>
              </label>
              <PasswordInput
                id="password"
                className={`form-control ${passwordErr ? 'error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <div className={`form-error ${passwordErr ? 'visible' : ''}`}>{passwordErr}</div>
            </div>

            <button type="submit" className="btn-pl" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {loading ? 'Loading…' : 'Sign In'}
            </button>
          </form>

          <div className="divider">or</div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--td)' }}>
            Don't have an account?{' '}
            <Link to="/client-portal/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>
              Create one
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
