import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/portal.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'invalid'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    async function verify() {
      try {
        const data = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The token may be expired or invalid.');
      }
    }
    verify();
  }, [token]);

  return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="wrap" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div className="auth-card" id="card" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--cb)', padding: '40px 32px', boxShadow: 'var(--shadow-md)' }}>
          {status === 'loading' && (
            <div className="empty-state">
              <div className="spinner"></div>
              <p style={{ marginTop: '12px' }}>Verifying your email…</p>
            </div>
          )}

          {status === 'invalid' && (
            <>
              <div className="icon-wrap danger" style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,0,31,.1)' }}>
                <svg width="32" height="32" fill="none" stroke="#d4001f" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Invalid Link</h2>
              <p style={{ margin: '12px 0 24px', fontSize: '14px', color: 'var(--td)' }}>
                This verification link is missing a token. Please use the link from your email.
              </p>
              <Link to="/client-portal/login" className="btn-pl" style={{ width: '100%', justifyContent: 'center' }}>
                Go to Sign In
              </Link>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="icon-wrap success" style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,124,66,.1)' }}>
                <svg width="32" height="32" fill="none" stroke="#0a7c42" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Email Verified!</h2>
              <p style={{ margin: '12px 0 24px', fontSize: '14px', color: 'var(--td)' }}>{message}</p>
              <Link to="/client-portal/login" className="btn-pl" style={{ width: '100%', justifyContent: 'center' }}>
                Sign In Now
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="icon-wrap danger" style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,0,31,.1)' }}>
                <svg width="32" height="32" fill="none" stroke="#d4001f" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Verification Failed</h2>
              <p style={{ margin: '12px 0 24px', fontSize: '14px', color: 'var(--td)' }}>{message}</p>
              <Link to="/client-portal/login" className="btn-pl" style={{ width: '100%', justifyContent: 'center' }}>
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
