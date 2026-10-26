import { Link } from 'react-router-dom';
import { SMS_CONSENT_TEXT } from '../../utils/quote';

// Honeypot field, an optional text-message checkbox and a privacy notice, shared by the service-page
// quote forms. Sending the form is itself the request to be contacted (email/phone); texting needs the box.
// `consent` here means "I agree to texts" and is never required.
const SMS_LABEL = SMS_CONSENT_TEXT.replace(' See our Privacy Policy.', '');

export default function FormSafeguards({ id, consent, setConsent, hp, setHp }) {
  return (
    <>
      {/* Honeypot for bots: hidden from people, ignored by the server if filled */}
      <input
        type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
      />
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '8px 0 12px', padding: '14px 16px', borderRadius: '10px',
          border: `1px solid ${consent ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`, background: consent ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)', transition: 'border-color .2s',
        }}
      >
        <input
          type="checkbox" id={id} checked={consent} onChange={(e) => setConsent(e.target.checked)}
          style={{ width: '18px', height: '18px', minWidth: '18px', marginTop: '2px', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <label htmlFor={id} style={{ fontSize: '14px', color: 'var(--tm)', lineHeight: 1.5, cursor: 'pointer' }}>
          {SMS_LABEL} <span style={{ opacity: 0.8 }}>(optional)</span> View our{' '}
          <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </label>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.5, margin: '0 0 16px' }}>
        By sending this form you agree we may contact you by email or phone about your request.
      </p>
    </>
  );
}
