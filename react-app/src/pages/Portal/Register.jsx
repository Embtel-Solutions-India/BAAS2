import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/portal.css';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setAlertMsg('');

    let valid = true;
    const newErrors = {};

    const required = ['first_name', 'last_name', 'email', 'phone', 'company_name', 'password', 'confirm_password'];
    required.forEach(f => {
      if (!formData[f].trim()) {
        newErrors[f] = 'This field is required';
        valid = false;
      }
    });

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      valid = false;
    }

    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company_name: formData.company_name.trim(),
        password: formData.password
      });
      // Auto-login successful, redirect to client portal dashboard
      navigate('/client-portal/dashboard');
    } catch (err) {
      setAlertMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap" style={{ maxWidth: '460px' }}>
        <div className="auth-brand">
          <div className="auth-brand-icon">B</div>
          <h1>Create your account</h1>
          <p>Get started with BAAS Client Portal</p>
        </div>

        <div className="auth-card">
          {alertMsg && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              {alertMsg}
            </div>
          )}

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
              <input
                type="password"
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
              <input
                type="password"
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
              {loading ? 'Loading…' : 'Create Account'}
            </button>
          </form>

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
