import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
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
          <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: 'var(--td)' }}>Sign in to your BAAS Client Portal</p>
        </div>

        <div className="auth-card" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--cb)', padding: '32px', boxShadow: 'var(--shadow-md)' }}>
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
              <input
                type="password"
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

          <div className="divider" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: 'var(--td)', fontSize: '13px' }}>or</div>

          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--td)' }}>
            Don't have an account?{' '}
            <Link to="/client-portal/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>
              Create one
            </Link>
          </div>
        </div>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--td)' }}>
          <Link to="/" style={{ color: 'var(--accent)', fontWeight: '600' }}>← Back to main website</Link>
        </div>
      </div>
    </div>
  );
}
