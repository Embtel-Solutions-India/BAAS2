import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { trackRush, todayPT, daysToDeadline, isWithinOneBusinessDay, readUtm, captureUtm } from '../../utils/rush';
import { FORM_SERVICES, FORM_TIERS, FORM_REASONS, FORM_DOCS, FORM_MESSAGES } from '../../data/rush';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = {
  full_name: '', business_name: '', email: '', phone: '', existing_client: '', service: '',
  tier: '', deadline: '', reason: '', docs_ready: '', notes: '',
};

const usDigits = (v) => { const d = v.replace(/\D/g, ''); return d.length === 11 && d[0] === '1' ? d.slice(1) : d; };

const validate = (name, value) => {
  switch (name) {
    case 'full_name': return !value.trim() ? 'Full name is required.' : value.trim().length < 2 || value.trim().length > 80 ? 'Please enter 2–80 characters.' : '';
    case 'email': return !value ? 'Email address is required.' : !EMAIL_RE.test(value) ? 'Please enter a valid email address.' : '';
    case 'phone': return !value ? 'Phone number is required.' : usDigits(value).length !== 10 ? 'Please enter a 10-digit US phone number.' : '';
    case 'existing_client': return !value ? 'Please choose Yes or No.' : '';
    case 'service': return !value ? 'Please select a service.' : '';
    case 'tier': return !value ? 'Please choose a rush tier.' : '';
    case 'deadline': return !value ? 'Please choose your deadline.' : value < todayPT() ? 'Deadline cannot be in the past.' : '';
    case 'reason': return !value ? 'Please tell us what the deadline is for.' : '';
    case 'docs_ready': return !value ? 'Please tell us if your documents are ready.' : '';
    case 'notes': return value.length > 1000 ? 'Please keep this under 1,000 characters.' : '';
    default: return '';
  }
};

// Request Rush Service form (spec section 9). `prefill` = { service, tier, source, nonce }:
// tier / package buttons on the page set it, which pre-selects fields 6 and 7.
export default function RushRequestForm({ prefill }) {
  const [form, setForm] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [consentError, setConsentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [sendError, setSendError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const started = useRef(false);
  const source = useRef('form');

  useEffect(() => { captureUtm(); }, []);

  // Pre-select from tier / package buttons.
  useEffect(() => {
    if (!prefill || !prefill.nonce) return;
    source.current = prefill.source || 'form';
    setForm((f) => ({
      ...f,
      ...(prefill.service ? { service: prefill.service } : {}),
      ...(prefill.tier ? { tier: prefill.tier } : {}),
    }));
    setErrors((e) => ({ ...e, ...(prefill.service ? { service: '' } : {}), ...(prefill.tier ? { tier: '' } : {}) }));
    setDone(null);
  }, [prefill]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: validate(name, value) }));
  };
  const handleChange = (e) => set(e.target.name, e.target.value);
  const onFirstTouch = () => { if (!started.current) { started.current = true; trackRush('rush_form_start', { page: window.location.pathname }); } };

  const urgent = isWithinOneBusinessDay(form.deadline) && form.deadline >= todayPT();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.entries(form).forEach(([k, v]) => { const err = validate(k, v); if (err) newErrors[k] = err; });
    setErrors(newErrors);
    if (!consent) setConsentError(true);
    if (!consent || Object.keys(newErrors).length) return;

    setSubmitting(true); setSendError('');
    const days = daysToDeadline(form.deadline);
    try {
      await api.post('/rush-requests', {
        ...form,
        phone: usDigits(form.phone),
        consent: true,
        website: honeypot,
        // hidden fields (spec 9.1)
        page_url: window.location.href,
        ...readUtm(),
        button_clicked: source.current,
        submitted_at: new Date().toISOString(),
        days_to_deadline: days,
      });
      trackRush('rush_form_submit', {
        service: form.service, tier: form.tier, reason: form.reason, days_to_deadline: days,
        docs_ready: form.docs_ready, existing_client: form.existing_client,
      });
      setDone(form.full_name.trim().split(/\s+/)[0]);
    } catch {
      setSendError(FORM_MESSAGES.error);
    } finally {
      setSubmitting(false);
    }
  };

  const err = (name) => errors[name] && <div className="field-error" role="alert">{errors[name]}</div>;
  const cls = (name) => `form-input${errors[name] ? ' input-invalid' : ''}`;
  const text = (name, label, type = 'text', extra = {}, required = true) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label htmlFor={`rush_${name}`}>{label}{required && <span style={{ color: 'var(--accent)' }}> *</span>}</label>
      <input id={`rush_${name}`} name={name} type={type} value={form[name]} onChange={handleChange} onFocus={onFirstTouch} className={cls(name)} {...extra} />
      {err(name)}
    </div>
  );
  const select = (name, label, options, placeholder) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label htmlFor={`rush_${name}`}>{label} <span style={{ color: 'var(--accent)' }}>*</span></label>
      <select id={`rush_${name}`} name={name} value={form[name]} onChange={handleChange} onFocus={onFirstTouch} className={cls(name)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      {err(name)}
    </div>
  );
  const radios = (name, label, options) => (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontSize: '14px', color: 'var(--tm)', marginBottom: '8px', padding: 0 }}>{label} <span style={{ color: 'var(--accent)' }}>*</span></legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px' }}>
        {options.map((o) => (
          <label key={o} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--tm)', cursor: 'pointer' }}>
            <input type="radio" name={name} value={o} checked={form[name] === o} onChange={handleChange} onFocus={onFirstTouch} style={{ accentColor: 'var(--accent)', width: '17px', height: '17px' }} />
            {o}
          </label>
        ))}
      </div>
      {err(name)}
    </fieldset>
  );

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }} role="status">
        <div style={{ fontSize: '34px', marginBottom: '10px' }}>✅</div>
        <p style={{ fontSize: '17px', color: '#1a1a1a', lineHeight: 1.6, margin: 0 }}>{FORM_MESSAGES.success(done)}</p>
      </div>
    );
  }

  const stack = { display: 'grid', gap: '18px' };
  return (
    <form onSubmit={handleSubmit} noValidate style={stack}>
      {/* Honeypot for bots: hidden from people, ignored by the server if filled */}
      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />
      {text('full_name', 'Full name', 'text', { autoComplete: 'name', maxLength: 80 })}
      {text('business_name', 'Business name', 'text', { autoComplete: 'organization', maxLength: 120 }, false)}
      {text('email', 'Email', 'email', { autoComplete: 'email' })}
      {text('phone', 'Phone', 'tel', { autoComplete: 'tel', placeholder: '(510) 000-0000' })}
      {radios('existing_client', 'Are you a current BAAS client?', ['Yes', 'No'])}
      {select('service', 'Service needed', FORM_SERVICES, 'Select a service...')}
      {radios('tier', 'Rush tier', FORM_TIERS)}
      <div>
        {text('deadline', 'Your deadline (Pacific Time)', 'date', { min: todayPT() })}
        {urgent && <div role="status" style={{ marginTop: '8px', fontSize: '14px', color: 'var(--accent2)', fontWeight: 600 }}>{FORM_MESSAGES.urgentWarning}</div>}
      </div>
      {select('reason', 'What is the deadline for?', FORM_REASONS, 'Select a reason...')}
      {radios('docs_ready', 'Are your documents ready?', FORM_DOCS)}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="rush_notes">Anything else we should know?</label>
        <textarea id="rush_notes" name="notes" value={form.notes} onChange={handleChange} onFocus={onFirstTouch} maxLength={1000} className={cls('notes')} style={{ minHeight: '110px' }} />
        <div style={{ fontSize: '13px', color: 'var(--tf)', marginTop: '6px' }}>{FORM_MESSAGES.notesHelper}</div>
        {err('notes')}
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '10px',
          border: `1px solid ${consent ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`, background: consent ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <input
          type="checkbox" id="rush_consent" checked={consent}
          onChange={(e) => { setConsent(e.target.checked); setConsentError(false); onFirstTouch(); }}
          style={{ width: '18px', height: '18px', minWidth: '18px', marginTop: '2px', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <label htmlFor="rush_consent" style={{ fontSize: '14px', color: 'var(--tm)', lineHeight: 1.5, cursor: 'pointer' }}>
          {FORM_MESSAGES.consent} <span style={{ color: 'var(--accent)', fontWeight: 600 }}>*</span>{' '}
          <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link>
        </label>
      </div>
      {consentError && <div role="alert" style={{ color: '#d4001f', fontSize: '13px', marginTop: '-8px' }}>Please tick the box above to continue.</div>}
      {sendError && <div role="alert" style={{ color: '#d4001f', fontSize: '14px' }}>{sendError}</div>}
      <button type="submit" className="form-submit" disabled={submitting}>{submitting ? 'Sending...' : FORM_MESSAGES.heading}</button>
    </form>
  );
}
