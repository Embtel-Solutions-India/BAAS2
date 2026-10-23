import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const EMPTY = { first_name: '', last_name: '', email: '', phone: '', message: '' };

const validate = (name, value) => {
  switch (name) {
    case 'first_name': return !value ? 'First name is required.' : value.length < 2 ? 'First name must be at least 2 characters.' : '';
    case 'last_name': return !value ? 'Last name is required.' : value.length < 2 ? 'Last name must be at least 2 characters.' : '';
    case 'email': return !value ? 'Email address is required.' : !EMAIL_RE.test(value) ? 'Please enter a valid email address.' : '';
    case 'phone': return !value ? 'Phone number is required.' : !PHONE_RE.test(value) ? 'Please enter a valid phone number.' : '';
    case 'message': return !value ? 'Message is required.' : value.length < 10 ? 'Message must be at least 10 characters.' : '';
    default: return '';
  }
};

// Shared contact form (Contact page + Bookkeeping page). `source` tells the team where it came from.
export default function ContactForm({ source = 'Contact page', idPrefix = 'cf' }) {
  const [form, setForm] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [consentError, setConsentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState('');
  const [honeypot, setHoneypot] = useState('');

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
      // Backend emails the enquiry to info@bayareaaccountingsolutions.com
      await api.post('/contact-requests', { ...form, source, consent: true, website: honeypot });
      // Google Ads conversion: "Contact" form submitted
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', { send_to: 'AW-18506219893/GsyoCJ6Qx5gdEPWCuvhE' });
        window.gtag('event', 'generate_lead', { form: source });
      }
      setSubmitted(true);
    } catch (err) {
      setSendError(err.message && !/^Request failed|Failed to fetch|NetworkError/i.test(err.message)
        ? err.message
        : 'Sorry, we could not send your message. Please try again or call us at (510) 962-7300.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, type, placeholder, autoComplete) => (
    <div className="form-group">
      <label htmlFor={`${idPrefix}_${name}`}>{label}</label>
      <input
        id={`${idPrefix}_${name}`} name={name} type={type} placeholder={placeholder} value={form[name]}
        onChange={handleChange} autoComplete={autoComplete} className={`form-input${errors[name] ? ' input-invalid' : ''}`}
      />
      {errors[name] && <div className="field-error">{errors[name]}</div>}
    </div>
  );

  return (
    <div style={{ padding: '36px', borderRadius: '20px', background: 'var(--card)', border: '1px solid var(--cb)' }}>
      <h3 aria-level="2" className="serif" style={{ fontSize: '25px', marginBottom: '6px' }}>Send us a message</h3>
      <p style={{ fontSize: '15px', color: 'var(--td)', marginBottom: '24px' }}>We&apos;ll get back to you within 24 hours.</p>

      {submitted ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }} role="status">
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>✅</div>
          <p className="serif" style={{ fontSize: '24px', marginBottom: '10px' }}>Thank you, {form.first_name}!</p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '6px' }}>Your message has been sent.</p>
          <p style={{ fontSize: '15px', color: 'var(--tm)', lineHeight: 1.6 }}>
            Our team will get back to you within 24 hours. If it&apos;s urgent, call{' '}
            <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot for bots: hidden from people, ignored by the server if filled */}
          <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0 16px' }}>
            {field('first_name', 'First Name', 'text', 'John', 'given-name')}
            {field('last_name', 'Last Name', 'text', 'Doe', 'family-name')}
          </div>
          {field('email', 'Email', 'email', 'you@company.com', 'email')}
          {field('phone', 'Phone', 'tel', '(510) 000-0000', 'tel')}
          <div className="form-group">
            <label htmlFor={`${idPrefix}_message`}>Message</label>
            <textarea
              id={`${idPrefix}_message`} name="message" value={form.message} onChange={handleChange}
              className={`form-input${errors.message ? ' input-invalid' : ''}`}
              placeholder="Tell us about your business and how we can help..."
            />
            {errors.message && <div className="field-error">{errors.message}</div>}
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px', padding: '14px 16px', borderRadius: '10px',
              border: `1px solid ${consent ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`, background: consent ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)', transition: 'border-color .2s',
            }}
          >
            <input
              type="checkbox" id={`${idPrefix}_consent`} checked={consent}
              onChange={(e) => { setConsent(e.target.checked); setConsentError(false); }}
              style={{ width: '18px', height: '18px', minWidth: '18px', marginTop: '2px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <label htmlFor={`${idPrefix}_consent`} style={{ fontSize: '14px', color: 'var(--tm)', lineHeight: 1.5, cursor: 'pointer' }}>
              I agree to receive updates about my application or service information via SMS, email, and phone from Bay Area Accounting Solutions.
              Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out at any time. View our{' '}
              <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link>.{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>*</span>
            </label>
          </div>
          {consentError && <div style={{ color: '#d4001f', fontSize: '13px', margin: '-12px 0 14px' }}>Please tick the box above to continue.</div>}
          {sendError && <div role="alert" style={{ color: '#d4001f', fontSize: '14px', marginBottom: '12px' }}>{sendError}</div>}
          <button type="submit" className="form-submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Message'}</button>
        </form>
      )}
      <p style={{ fontSize: '13px', color: 'var(--tf)', marginTop: '12px', textAlign: 'center' }}>
        Or call us directly: <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>
      </p>
    </div>
  );
}
