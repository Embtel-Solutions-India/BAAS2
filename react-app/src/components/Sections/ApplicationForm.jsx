import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import SmsConsent from '../UI/SmsConsent';
import { SMS_OPT_IN_MESSAGE } from '../../utils/quote';
import { APPLICATION_WEBHOOK, buildApplicationPayload, phoneIssue, postForm, SEND_FAILED } from '../../utils/formWebhooks';
import { APPLICATION_SERVICES, CLIENT_TYPES, PAYROLL_SERVICE, SPEED_LABELS, US_STATES } from '../../data/applicationForm';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = { first_name: '', last_name: '', email: '', phone: '', client_type: '', state: '', services: {}, payroll_employees: '' };

// Services application form. One POST per submission to the n8n application webhook, carrying the answers plus the
// five tracking values (see utils/formWebhooks.js). The form never sends prices.
// `defaultService` (a service name) is ticked from the start, for example on a service page; the visitor can untick or change it.
export default function ApplicationForm({ idPrefix = 'ap', defaultService = '' }) {
  const [form, setForm] = useState(() => {
    const svc = APPLICATION_SERVICES.find((x) => x.value === defaultService);
    return svc ? { ...EMPTY, services: { [svc.value]: svc.speeds[0] } } : EMPTY;
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sms, setSms] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the services dropdown on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const selected = APPLICATION_SERVICES.filter((x) => Object.prototype.hasOwnProperty.call(form.services, x.value));
  const askEmployees = form.services[PAYROLL_SERVICE] === 'emergency';

  const check = (name, value, f = form) => {
    switch (name) {
      case 'first_name': return !value.trim() ? 'First name is required.' : '';
      case 'last_name': return !value.trim() ? 'Last name is required.' : '';
      case 'email': return !value.trim() ? 'Email address is required.' : !EMAIL_RE.test(value.trim()) ? 'Please enter a valid email address.' : '';
      case 'phone': return phoneIssue(value);
      case 'client_type': return value ? '' : 'Please choose a client type.';
      case 'state': return value ? '' : 'Please choose your state.';
      case 'services': return Object.keys(value).length ? '' : 'Choose at least one service.';
      case 'payroll_employees': {
        if (f.services[PAYROLL_SERVICE] !== 'emergency') return '';
        const n = Number(value);
        return value === '' || !Number.isInteger(n) || n < 1 || n > 100000 ? 'Enter the number of employees (1 or more).' : '';
      }
      default: return '';
    }
  };

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: check(name, value) }));
  };

  const toggleService = (svc) => {
    setForm((f) => {
      const services = { ...f.services };
      if (services[svc.value]) delete services[svc.value];
      else services[svc.value] = svc.speeds[0];
      return { ...f, services };
    });
    setErrors((err) => ({ ...err, services: '' }));
  };

  const setSpeed = (svc, speed) => {
    setForm((f) => ({ ...f, services: { ...f.services, [svc.value]: speed } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    ['first_name', 'last_name', 'email', 'phone', 'client_type', 'state', 'services', 'payroll_employees'].forEach((k) => {
      const err = check(k, form[k]);
      if (err) newErrors[k] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    if (honeypot) { setSubmitted(true); return; } // a bot filled the hidden field: pretend it worked, send nothing

    setSubmitting(true); setSendError('');
    try {
      await postForm(APPLICATION_WEBHOOK, buildApplicationPayload(form, sms));
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form: 'Application' });
      setSubmitted(true);
    } catch {
      setSendError(SEND_FAILED);
    } finally {
      setSubmitting(false);
    }
  };

  const id = (n) => `${idPrefix}_${n}`;
  const text = (name, label, type, placeholder, autoComplete) => (
    <div className="form-group">
      <label htmlFor={id(name)}>{label}</label>
      <input
        id={id(name)} name={name} type={type} placeholder={placeholder} value={form[name]} autoComplete={autoComplete}
        onChange={(e) => setField(name, e.target.value)} className={`form-input${errors[name] ? ' input-invalid' : ''}`}
      />
      {errors[name] && <div className="field-error">{errors[name]}</div>}
    </div>
  );
  const select = (name, label, options, placeholder) => (
    <div className="form-group">
      <label htmlFor={id(name)}>{label}</label>
      <select
        id={id(name)} name={name} value={form[name]} onChange={(e) => setField(name, e.target.value)}
        className={`form-input${errors[name] ? ' input-invalid' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[name] && <div className="field-error">{errors[name]}</div>}
    </div>
  );

  if (submitted) {
    return (
      <div style={{ padding: '36px', borderRadius: '20px', background: 'var(--card)', border: '1px solid var(--cb)', textAlign: 'center' }} role="status">
        <div style={{ fontSize: '34px', marginBottom: '10px' }}>✅</div>
        <p className="serif" style={{ fontSize: '24px', marginBottom: '10px' }}>Thank you, {form.first_name.trim()}!</p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '6px' }}>Your application has been received.</p>
        <p style={{ fontSize: '15px', color: 'var(--tm)', lineHeight: 1.6 }}>
          Our team will review it and get back to you shortly. If it&apos;s urgent, call{' '}
          <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>.
        </p>
        {sms && <p style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.5, marginTop: '14px' }}>{SMS_OPT_IN_MESSAGE}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ padding: '36px', borderRadius: '20px', background: 'var(--card)', border: '1px solid var(--cb)' }}>
      {/* Honeypot for bots: hidden from people */}
      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0 16px' }}>
        {text('first_name', 'First Name', 'text', 'John', 'given-name')}
        {text('last_name', 'Last Name', 'text', 'Doe', 'family-name')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0 16px' }}>
        {text('email', 'Email', 'email', 'you@company.com', 'email')}
        {text('phone', 'Phone', 'tel', '+1 510 555 0123', 'tel')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0 16px' }}>
        {select('client_type', 'Client Type', CLIENT_TYPES, 'Select...')}
        {select('state', 'State', US_STATES, 'Select your state...')}
      </div>

      <div className="form-group">
        <label id={id('services_label')} htmlFor={id('services_toggle')}>Services you need <span style={{ opacity: 0.7 }}>(choose at least one)</span></label>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button" id={id('services_toggle')} aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}
            className={`form-input${errors.services ? ' input-invalid' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected.length ? '#1a1a1a' : 'rgba(0,0,0,0.45)' }}>
              {selected.length ? selected.map((x) => (x.speeds.length > 1 && form.services[x.value] !== 'standard' ? `${x.value} (${form.services[x.value]})` : x.value)).join(', ') : 'Select services...'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {selected.length > 0 && <span style={{ fontSize: '12px', fontWeight: 700, background: 'var(--accent)', color: '#fff', borderRadius: '999px', padding: '2px 8px' }}>{selected.length}</span>}
              <ChevronDown size={18} aria-hidden="true" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </span>
          </button>
          {menuOpen && (
            <div role="group" aria-label="Services" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 30, background: '#fff', border: '1px solid var(--bl)', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: '6px', maxHeight: 'min(560px, 75vh)', overflowY: 'auto' }}>
              {APPLICATION_SERVICES.map((svc) => {
                const on = Object.prototype.hasOwnProperty.call(form.services, svc.value);
                const cid = id(`svc_${svc.value.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`);
                return (
                  <div key={svc.value} style={{ borderRadius: '8px', background: on ? 'rgba(212,0,31,.06)' : 'transparent' }}>
                    <label htmlFor={cid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', color: '#1a1a1a' }}>
                      <input type="checkbox" id={cid} checked={on} onChange={() => toggleService(svc)} style={{ width: '18px', height: '18px', minWidth: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                      {svc.value}
                    </label>
                    {on && svc.speeds.length > 1 && (
                      <div style={{ padding: '0 12px 12px 40px' }}>
                        <label htmlFor={`${cid}_speed`} style={{ display: 'block', fontSize: '13px', color: 'var(--td)', marginBottom: '4px' }}>How fast do you need it?</label>
                        <select
                          id={`${cid}_speed`} value={form.services[svc.value]} onChange={(e) => setSpeed(svc, e.target.value)}
                          className="form-input" style={{ padding: '10px 12px', fontSize: '15px' }}
                        >
                          {svc.speeds.map((sp) => <option key={sp} value={sp}>{SPEED_LABELS[sp]}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {errors.services && <div className="field-error">{errors.services}</div>}

        <p style={{ fontSize: '13px', color: 'var(--td)', margin: '10px 0 0' }}>
          Rush fees apply to faster speeds. See <Link to="/rush-service" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Rush Service pricing</Link>.
        </p>
      </div>

      {askEmployees && (
        <div className="form-group">
          <label htmlFor={id('payroll_employees')}>How many employees need to be paid?</label>
          <input
            id={id('payroll_employees')} name="payroll_employees" type="number" inputMode="numeric" min="1" step="1" value={form.payroll_employees}
            onChange={(e) => setField('payroll_employees', e.target.value)} className={`form-input${errors.payroll_employees ? ' input-invalid' : ''}`}
          />
          {errors.payroll_employees && <div className="field-error">{errors.payroll_employees}</div>}
        </div>
      )}

      <SmsConsent id={id('sms')} checked={sms} onChange={setSms} />
      <p style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.5, margin: '-6px 0 14px' }}>
        <strong>Opt-in confirmation message:</strong> &ldquo;{SMS_OPT_IN_MESSAGE}&rdquo;
      </p>
      <p style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.5, margin: '0 0 16px' }}>
        By sending this form you agree we may contact you by email or phone about your application. See our{' '}
        <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link>.
      </p>
      {sendError && <div role="alert" style={{ color: '#d4001f', fontSize: '14px', marginBottom: '12px' }}>{sendError}</div>}
      <button type="submit" className="form-submit" disabled={submitting}>{submitting ? 'Sending...' : 'Submit Application'}</button>
    </form>
  );
}
