import { useState } from 'react';
import { Link } from 'react-router-dom';
import SmsConsent from '../UI/SmsConsent';
import { CONTACT_WEBHOOK, buildContactPayload, phoneIssue, postForm, SEND_FAILED } from '../../utils/formWebhooks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = { first_name: '', last_name: '', email: '', phone: '', message: '' };

const validate = (name, value) => {
  switch (name) {
    case 'first_name': return !value ? 'First name is required.' : value.length < 2 ? 'First name must be at least 2 characters.' : '';
    case 'last_name': return !value ? 'Last name is required.' : value.length < 2 ? 'Last name must be at least 2 characters.' : '';
    case 'email': return !value ? 'Email address is required.' : !EMAIL_RE.test(value) ? 'Please enter a valid email address.' : '';
    case 'phone': return phoneIssue(value);
    default: return '';
  }
};

// Shared contact form (Contact page + Bookkeeping page). One POST per submission to the n8n contact webhook,
// carrying the form answers plus the five tracking values (see utils/formWebhooks.js). `source` is only used for analytics.
export default function ContactForm({ source = 'Contact page', idPrefix = 'cf' }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sms, setSms] = useState(false);

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
    if (Object.keys(newErrors).length) return;

    if (honeypot) { setSubmitted(true); return; } // a bot filled the hidden field: pretend it worked, send nothing

    setSubmitting(true); setSendError('');
    try {
      await postForm(CONTACT_WEBHOOK, buildContactPayload(form, sms));
      // Google Ads conversion: "Contact" form submitted
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', { send_to: 'AW-18506219893/GsyoCJ6Qx5gdEPWCuvhE' });
        window.gtag('event', 'generate_lead', { form: source });
      }
      setSubmitted(true);
    } catch {
      setSendError(SEND_FAILED);
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
          {field('phone', 'Phone', 'tel', '+1 510 000 0000', 'tel')}
          <div className="form-group">
            <label htmlFor={`${idPrefix}_message`}>Message <span style={{ opacity: 0.7 }}>(optional)</span></label>
            <textarea
              id={`${idPrefix}_message`} name="message" value={form.message} onChange={handleChange}
              className="form-input"
              placeholder="Tell us about your business and how we can help..."
            />
          </div>
          <SmsConsent id={`${idPrefix}_sms`} checked={sms} onChange={setSms} />
          <p style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.5, margin: '0 0 16px' }}>
            By sending this form you agree we may contact you by email or phone about your enquiry. See our{' '}
            <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
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
