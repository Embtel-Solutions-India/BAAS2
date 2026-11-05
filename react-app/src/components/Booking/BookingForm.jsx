import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createBooking } from '../../utils/bookingApi';
import { phoneIssue } from '../../utils/formWebhooks';
import { smsFields } from '../../utils/quote';
import SmsConsent from '../UI/SmsConsent';
import { formatLongDate, formatTime } from '../../utils/bookingDates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOTES_MAX = 1000;
const EMPTY = { name: '', email: '', phone: '', company: '', purpose: '', appointmentType: '', notes: '', consent: false, sms: false };

// Customer details for the chosen slot. The date, time and timezone are read-only here and are checked again
// by the server; the end time is never sent because the server works it out from the appointment type.
export default function BookingForm({ config, slot, zoneLabel, idempotencyKey, initialValues, onValuesChange, onBack, onBooked, onSlotTaken }) {
  const types = config.appointmentTypes || [];
  const [values, setValues] = useState({ ...EMPTY, appointmentType: types.length === 1 ? types[0].id : '', ...(initialValues || {}) });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const sending = useRef(false); // blocks a second submit before React re-renders the disabled button

  const check = (name, v) => {
    switch (name) {
      case 'name': return v.trim().length < 2 ? 'Please enter your full name.' : '';
      case 'email': return !v.trim() ? 'Email address is required.' : !EMAIL_RE.test(v.trim()) ? 'Please enter a valid email address.' : '';
      case 'phone': return phoneIssue(v);
      case 'purpose': return v ? '' : 'Please choose what the appointment is about.';
      case 'appointmentType': return types.length > 1 && !v ? 'Please choose an appointment type.' : '';
      case 'notes': return v.length > NOTES_MAX ? `Please keep notes under ${NOTES_MAX} characters.` : '';
      case 'consent': return v ? '' : 'Please accept the privacy policy to continue.';
      default: return '';
    }
  };

  const set = (name, v) => {
    const next = { ...values, [name]: v };
    setValues(next);
    if (onValuesChange) onValuesChange(next);
    setErrors((e) => (e[name] ? { ...e, [name]: check(name, v) } : e));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending.current) return;
    const next = {};
    Object.keys(EMPTY).forEach((k) => { const m = check(k, values[k]); if (m) next[k] = m; });
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { const el = document.getElementById(`bk_${first}`); if (el) el.focus(); return; }

    sending.current = true; setSubmitting(true); setFormError('');
    try {
      const res = await createBooking({
        name: values.name, email: values.email, phone: values.phone, company: values.company, purpose: values.purpose,
        appointmentType: values.appointmentType || (types[0] && types[0].id) || '', notes: values.notes, consent: true, ...smsFields(values.sms),
        date: slot.date, startTime: slot.startTime, timezone: config.timezone, idempotencyKey, website: honeypot,
      });
      try { if (typeof window.gtag === 'function') window.gtag('event', 'book_appointment', { value: 1 }); } catch { /* analytics must never break booking */ }
      onBooked(res);
    } catch (err) {
      if (err.status === 409 && ['SLOT_UNAVAILABLE', 'DATE_UNAVAILABLE'].includes(err.code)) { onSlotTaken(err.message); return; }
      if (err.fields) setErrors((prev) => ({ ...prev, ...err.fields }));
      setFormError(err.message);
    } finally {
      sending.current = false; setSubmitting(false);
    }
  };

  const field = (name, label, props = {}, hint = '') => (
    <div className="bk-field">
      <label htmlFor={`bk_${name}`}>{label}{props.optional ? <span className="bk-optional"> (optional)</span> : null}</label>
      <input
        id={`bk_${name}`} name={name} value={values[name]} onChange={(e) => set(name, e.target.value)} className={`form-input${errors[name] ? ' input-invalid' : ''}`}
        aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `bk_${name}_err` : undefined} maxLength={props.maxLength || 200}
        type={props.type || 'text'} autoComplete={props.autoComplete} placeholder={props.placeholder} inputMode={props.inputMode}
      />
      {hint && !errors[name] && <div className="bk-hint">{hint}</div>}
      {errors[name] && <div className="field-error" id={`bk_${name}_err`} role="alert">{errors[name]}</div>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate aria-label="Appointment details">
      <button type="button" className="bk-back" onClick={onBack} disabled={submitting}>← Change date or time</button>
      <h3 className="bk-panel-title">Your details</h3>

      <dl className="bk-summary">
        <div><dt>Date</dt><dd>{formatLongDate(slot.date)}</dd></div>
        <div><dt>Time</dt><dd>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</dd></div>
        <div><dt>Time zone</dt><dd>{zoneLabel}</dd></div>
        {types.length === 1 && <div><dt>Appointment</dt><dd>{types[0].label}</dd></div>}
      </dl>
      <input type="hidden" name="date" value={slot.date} readOnly />
      <input type="hidden" name="startTime" value={slot.startTime} readOnly />

      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="bk-honeypot" />

      {field('name', 'Full name', { autoComplete: 'name', placeholder: 'Jane Smith' })}
      <div className="bk-two">
        {field('email', 'Email address', { type: 'email', autoComplete: 'email', placeholder: 'you@company.com' })}
        {field('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '+1 415 555 0123' }, 'Include the country code if outside the US.')}
      </div>
      {field('company', 'Company name', { optional: true, autoComplete: 'organization', maxLength: 160 })}

      {types.length > 1 && (
        <div className="bk-field">
          <label htmlFor="bk_appointmentType">Appointment type</label>
          <select id="bk_appointmentType" value={values.appointmentType} onChange={(e) => set('appointmentType', e.target.value)} className={`form-input${errors.appointmentType ? ' input-invalid' : ''}`} aria-invalid={!!errors.appointmentType}>
            <option value="">Select a type…</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {errors.appointmentType && <div className="field-error" role="alert">{errors.appointmentType}</div>}
        </div>
      )}

      <div className="bk-field">
        <label htmlFor="bk_purpose">What is the appointment about?</label>
        <select id="bk_purpose" value={values.purpose} onChange={(e) => set('purpose', e.target.value)} className={`form-input${errors.purpose ? ' input-invalid' : ''}`} aria-invalid={!!errors.purpose} aria-describedby={errors.purpose ? 'bk_purpose_err' : undefined}>
          <option value="">Select a topic…</option>
          {(config.purposes || []).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.purpose && <div className="field-error" id="bk_purpose_err" role="alert">{errors.purpose}</div>}
      </div>

      <div className="bk-field">
        <label htmlFor="bk_notes">Additional notes<span className="bk-optional"> (optional)</span></label>
        <textarea id="bk_notes" rows={3} value={values.notes} maxLength={NOTES_MAX} onChange={(e) => set('notes', e.target.value)} className={`form-input${errors.notes ? ' input-invalid' : ''}`} placeholder="Anything we should know before we talk?" aria-invalid={!!errors.notes} />
        <div className="bk-hint" aria-live="polite">{values.notes.length}/{NOTES_MAX}</div>
        {errors.notes && <div className="field-error" role="alert">{errors.notes}</div>}
      </div>

      <div className="bk-consent">
        <input id="bk_consent" type="checkbox" checked={values.consent} onChange={(e) => set('consent', e.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'bk_consent_err' : undefined} />
        <label htmlFor="bk_consent">I agree to the <Link to="/privacy-policy" target="_blank">Privacy Policy</Link> and to being contacted about this appointment.</label>
      </div>
      {errors.consent && <div className="field-error" id="bk_consent_err" role="alert">{errors.consent}</div>}

      <SmsConsent id="bk_sms" checked={!!values.sms} onChange={(v) => set('sms', v)} />

      {formError && <div className="bk-alert" role="alert">{formError}</div>}
      <button type="submit" className="form-submit" disabled={submitting}>{submitting ? 'Booking…' : 'Confirm appointment'}</button>
    </form>
  );
}
