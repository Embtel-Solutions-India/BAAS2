import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';

// Any button can open this popup with: openRushModal()
export const RUSH_MODAL_EVENT = 'open-rush-modal';
export const openRushModal = () => window.dispatchEvent(new Event(RUSH_MODAL_EVENT));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const SERVICES = [
  'Bookkeeping & Accounting', 'Business & Individual Taxes', 'Payroll Management',
  'Business Formation', 'Registered Agent', 'Accounting Cleanup', 'Other',
];
const EMPTY = { first_name: '', last_name: '', email: '', phone: '', service: '', deadline: '', message: '' };

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const validate = (name, value) => {
  switch (name) {
    case 'first_name': return !value ? 'First name is required.' : value.length < 2 ? 'At least 2 characters.' : '';
    case 'last_name': return !value ? 'Last name is required.' : value.length < 2 ? 'At least 2 characters.' : '';
    case 'email': return !value ? 'Email address is required.' : !EMAIL_RE.test(value) ? 'Please enter a valid email address.' : '';
    case 'phone': return !value ? 'Phone number is required.' : !PHONE_RE.test(value) ? 'Please enter a valid phone number.' : '';
    case 'service': return !value ? 'Please select a service.' : '';
    case 'deadline': return !value ? 'Please tell us when you need it by.' : value < todayISO() ? 'Date cannot be in the past.' : '';
    case 'message': return !value ? 'Please describe what you need.' : value.length < 10 ? 'At least 10 characters.' : '';
    default: return '';
  }
};

export default function RushRequestModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [consentError, setConsentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const firstField = useRef(null);
  const opener = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus?.();
  }, []);

  useEffect(() => {
    const onOpen = () => {
      opener.current = document.activeElement;
      setForm(EMPTY); setErrors({}); setConsent(false); setConsentError(false);
      setSubmitted(false); setSendError('');
      setOpen(true);
    };
    window.addEventListener(RUSH_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(RUSH_MODAL_EVENT, onOpen);
  }, []);

  // Esc to close, lock page scroll, focus first field while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstField.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [open, close]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.entries(form).forEach(([k, v]) => { const err = validate(k, v); if (err) newErrors[k] = err; });
    setErrors(newErrors);
    if (!consent) setConsentError(true);
    if (!consent || Object.keys(newErrors).length) return;

    setSubmitting(true); setSendError('');
    try {
      // Backend emails the request to info@bayareaaccountingsolutions.com
      await api.post('/rush-requests', { ...form, consent: true, website: honeypot });
      setSubmitted(true);
    } catch (err) {
      setSendError(err.message && !/^Request failed|Failed to fetch|NetworkError/i.test(err.message) ? err.message : 'Sorry, we could not send your request. Please try again or call us at (510) 962-7300.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, type, placeholder, extra = {}) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label htmlFor={`rush_${name}`}>{label}</label>
      <input
        id={`rush_${name}`} name={name} type={type} placeholder={placeholder} value={form[name]}
        onChange={handleChange} className={`form-input${errors[name] ? ' input-invalid' : ''}`}
        ref={name === 'first_name' ? firstField : undefined} {...extra}
      />
      {errors[name] && <div className="field-error">{errors[name]}</div>}
    </div>
  );

  return (
    <div className="modal-overlay open" role="dialog" aria-modal="true" aria-labelledby="rush-modal-title">
      <div className="modal-backdrop" onClick={close} />
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div>
            <div className="slabel" style={{ marginBottom: '6px' }}>Rush Service</div>
            <h3 id="rush-modal-title" className="serif" style={{ fontSize: '26px', margin: 0 }}>Request Rush Service</h3>
          </div>
          <button type="button" className="modal-close" onClick={close} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }} role="status">
              <div style={{ fontSize: '34px', marginBottom: '10px' }}>✅</div>
              <p className="serif" style={{ fontSize: '24px', marginBottom: '10px' }}>Thank you, {form.first_name}!</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
                Your Rush Service request has been received.
              </p>
              <p style={{ fontSize: '15px', color: 'var(--tm)', lineHeight: 1.6, marginBottom: '8px' }}>
                Our team will review your deadline and contact you shortly to confirm what we can do.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--tf)', lineHeight: 1.6, marginBottom: '22px' }}>
                Rush Service is subject to feasibility and availability. If it&apos;s very urgent, call us at{' '}
                <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>.
              </p>
              <button type="button" className="btn-pl" onClick={close} style={{ padding: '12px 28px', fontSize: '16px' }}>Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot for bots: hidden from people, ignored by the server if filled */}
              <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />
              <p style={{ fontSize: '14px', color: 'var(--td)', margin: '0 0 20px', lineHeight: 1.6 }}>
                Tell us what you need and when. We&apos;ll confirm what&apos;s feasible before we begin.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px 16px', marginBottom: '14px' }}>
                {field('first_name', 'First Name', 'text', 'John', { autoComplete: 'given-name' })}
                {field('last_name', 'Last Name', 'text', 'Doe', { autoComplete: 'family-name' })}
                {field('email', 'Email', 'email', 'you@company.com', { autoComplete: 'email' })}
                {field('phone', 'Phone', 'tel', '(510) 000-0000', { autoComplete: 'tel' })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px 16px', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="rush_service">Service Needed</label>
                  <select id="rush_service" name="service" value={form.service} onChange={handleChange} className={`form-input${errors.service ? ' input-invalid' : ''}`}>
                    <option value="">Select a service...</option>
                    {SERVICES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {errors.service && <div className="field-error">{errors.service}</div>}
                </div>
                {field('deadline', 'Needed By', 'date', '', { min: todayISO() })}
              </div>

              <div className="form-group">
                <label htmlFor="rush_message">What do you need done?</label>
                <textarea
                  id="rush_message" name="message" value={form.message} onChange={handleChange}
                  className={`form-input${errors.message ? ' input-invalid' : ''}`}
                  placeholder="Briefly describe the work and why it's urgent..."
                />
                {errors.message && <div className="field-error">{errors.message}</div>}
              </div>

              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', padding: '12px 14px', borderRadius: '10px',
                  border: `1px solid ${consent ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`, background: consent ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <input
                  type="checkbox" id="rush_consent" checked={consent}
                  onChange={(e) => { setConsent(e.target.checked); setConsentError(false); }}
                  style={{ width: '18px', height: '18px', minWidth: '18px', marginTop: '2px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <label htmlFor="rush_consent" style={{ fontSize: '13px', color: 'var(--tm)', lineHeight: 1.5, cursor: 'pointer' }}>
                  I agree to be contacted about my request via SMS, email, and phone by Bay Area Accounting Solutions. Message frequency
                  varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out. See our{' '}
                  <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link>.{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>*</span>
                </label>
              </div>
              {consentError && <div style={{ color: '#d4001f', fontSize: '13px', margin: '-8px 0 12px' }}>Please tick the box above to continue.</div>}
              {sendError && <div role="alert" style={{ color: '#d4001f', fontSize: '14px', marginBottom: '12px' }}>{sendError}</div>}

              <button type="submit" className="form-submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Rush Request'}
              </button>
              <p style={{ fontSize: '12px', color: 'var(--tf)', margin: '12px 0 0', textAlign: 'center' }}>
                Rush Service is subject to feasibility and availability. Or call <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
