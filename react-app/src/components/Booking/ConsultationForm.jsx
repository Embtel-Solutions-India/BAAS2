import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { bookConsultation } from '../../utils/consultationApi';
import { getTracking } from '../../utils/tracking';
import { phoneIssue, normalizePhone } from '../../utils/formWebhooks';
import { smsFields } from '../../utils/quote';
import SmsConsent from '../UI/SmsConsent';
import { APPLICATION_SERVICES } from '../../data/applicationForm';
import { formatLongDate, formatTime } from '../../utils/bookingDates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGE_MAX = 1000;
const EMPTY = { first_name: '', last_name: '', email: '', phone: '', services: [], message: '', sms: false };
const SERVICE_NAMES = APPLICATION_SERVICES.map((s) => s.value); // the exact service names the booking system expects

// Details for the chosen time. One request goes to our server, which forwards it to the booking system together with
// the five marketing tracking values. start_time is the slot string exactly as the availability list gave it.
export default function ConsultationForm({ slot, zoneLabel, initialValues, onValuesChange, onBack, onResult }) {
  const [values, setValues] = useState({ ...EMPTY, ...(initialValues || {}) });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const sending = useRef(false); // stops a second submit before React has re-rendered the disabled button
  const [ddOpen, setDdOpen] = useState(false);
  const ddRef = useRef(null);

  // close the services dropdown when the visitor clicks elsewhere
  useEffect(() => {
    if (!ddOpen) return undefined;
    const away = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [ddOpen]);

  const check = (name, v) => {
    switch (name) {
      case 'first_name': return v.trim() ? '' : 'Please enter your first name.';
      case 'last_name': return v.trim() ? '' : 'Please enter your last name.';
      case 'email': return !v.trim() ? 'Email address is required.' : !EMAIL_RE.test(v.trim()) ? 'Please enter a valid email address.' : '';
      case 'phone': return phoneIssue(v);
      case 'message': return v.length > MESSAGE_MAX ? `Please keep your message under ${MESSAGE_MAX} characters.` : '';
      default: return '';
    }
  };

  const update = (patch) => {
    const next = { ...values, ...patch };
    setValues(next);
    if (onValuesChange) onValuesChange(next);
    return next;
  };
  const setField = (name, v) => {
    update({ [name]: v });
    setErrors((e) => (e[name] ? { ...e, [name]: check(name, v) } : e));
  };
  const toggleService = (name) => update({ services: values.services.includes(name) ? values.services.filter((s) => s !== name) : [...values.services, name] });

  const submit = async (e) => {
    e.preventDefault();
    if (sending.current) return;
    const next = {};
    ['first_name', 'last_name', 'email', 'phone', 'message'].forEach((k) => { const m = check(k, values[k]); if (m) next[k] = m; });
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { const el = document.getElementById(`bk_${first}`); if (el) el.focus(); return; }

    sending.current = true; setSubmitting(true); setFormError('');
    try {
      const res = await bookConsultation({
        first_name: values.first_name.trim(), last_name: values.last_name.trim(), email: values.email.trim(), phone: normalizePhone(values.phone),
        start_time: slot.iso, services: SERVICE_NAMES.filter((s) => values.services.includes(s)), message: values.message.trim(),
        ...smsFields(values.sms), ...getTracking(), website: honeypot,
      });
      if (res.success) {
        try { if (typeof window.gtag === 'function') window.gtag('event', 'book_appointment', { value: 1 }); } catch { /* analytics must never break booking */ }
      } else {
        setFormError(res.message);
      }
      onResult(res, values);
    } finally {
      sending.current = false; setSubmitting(false);
    }
  };

  const field = (name, label, props = {}, hint = '') => (
    <div className="bk-field">
      <label htmlFor={`bk_${name}`}>{label}</label>
      <input
        id={`bk_${name}`} name={name} value={values[name]} onChange={(e) => setField(name, e.target.value)} className={`form-input${errors[name] ? ' input-invalid' : ''}`}
        aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `bk_${name}_err` : undefined} maxLength={props.maxLength || 120}
        type={props.type || 'text'} autoComplete={props.autoComplete} placeholder={props.placeholder} inputMode={props.inputMode}
      />
      {hint && !errors[name] && <div className="bk-hint">{hint}</div>}
      {errors[name] && <div className="field-error" id={`bk_${name}_err`} role="alert">{errors[name]}</div>}
    </div>
  );

  return (
    <form id="consult-form" onSubmit={submit} noValidate aria-label="Consultation details">
      <button type="button" className="bk-back" onClick={onBack} disabled={submitting}>← Change date or time</button>
      <h3 className="bk-panel-title">Your details</h3>

      <dl className="bk-summary">
        <div><dt>Session</dt><dd>Free 1-to-1 Session (30 minutes)</dd></div>
        <div><dt>Date</dt><dd>{formatLongDate(slot.date)}</dd></div>
        <div><dt>Time</dt><dd>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</dd></div>
        <div><dt>Time zone</dt><dd>{zoneLabel}</dd></div>
      </dl>

      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="bk-honeypot" />

      <div className="bk-two">
        {field('first_name', 'First name', { autoComplete: 'given-name', placeholder: 'Priya' })}
        {field('last_name', 'Last name', { autoComplete: 'family-name', placeholder: 'Shah' })}
      </div>
      <div className="bk-two">
        {field('email', 'Email address', { type: 'email', autoComplete: 'email', placeholder: 'you@company.com', maxLength: 200 })}
        {field('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '+1 510 555 0123', maxLength: 30 }, 'Include the country code if outside the US.')}
      </div>

      <div className="bk-field">
        <label id="bk_services_label">What would you like help with?<span className="bk-optional"> (optional)</span></label>
        <div className="bk-dd" ref={ddRef}>
          <button
            type="button" className="form-input bk-dd-btn" aria-haspopup="listbox" aria-expanded={ddOpen} aria-labelledby="bk_services_label"
            onClick={() => setDdOpen((o) => !o)}
            onKeyDown={(e) => { if (e.key === 'Escape') setDdOpen(false); }}
          >
            <span className={values.services.length ? '' : 'bk-dd-ph'}>
              {values.services.length === 0 ? 'Select services' : values.services.length === 1 ? values.services[0] : `${values.services.length} services selected`}
            </span>
            <ChevronDown size={18} aria-hidden="true" className={ddOpen ? 'bk-dd-flip' : ''} />
          </button>
          {ddOpen && (
            <div className="bk-dd-panel" role="listbox" aria-multiselectable="true" aria-labelledby="bk_services_label" onKeyDown={(e) => { if (e.key === 'Escape') setDdOpen(false); }}>
              {SERVICE_NAMES.map((name) => (
                <label key={name} className="bk-check">
                  <input type="checkbox" checked={values.services.includes(name)} onChange={() => toggleService(name)} />
                  {name}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bk-field">
        <label htmlFor="bk_message">Anything we should know?<span className="bk-optional"> (optional)</span></label>
        <textarea id="bk_message" rows={3} value={values.message} maxLength={MESSAGE_MAX} onChange={(e) => setField('message', e.target.value)} className={`form-input${errors.message ? ' input-invalid' : ''}`} placeholder="Tell us a little about your business and what you need." aria-invalid={!!errors.message} />
        <div className="bk-hint" aria-live="polite">{values.message.length}/{MESSAGE_MAX}</div>
        {errors.message && <div className="field-error" role="alert">{errors.message}</div>}
      </div>

      <SmsConsent id="bk_sms" value={values.sms} onChange={(v) => setField('sms', v)} />

      <p className="bk-note" style={{ marginTop: 0 }}>
        By booking you agree we may contact you by email or phone about your consultation. See our <Link to="/privacy-policy" target="_blank">Privacy Policy</Link>.
      </p>
      {formError && <div className="bk-alert" role="alert">{formError}</div>}
      <button type="submit" className="form-submit" disabled={submitting}>{submitting ? 'Booking…' : 'Book my free session'}</button>
    </form>
  );
}
