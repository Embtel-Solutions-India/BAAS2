import { Link } from 'react-router-dom';

// Consent checkbox (with Privacy Policy link) plus a hidden honeypot field, shared by the service-page
// quote forms (audit C1). The wording matches the Contact form and the Rush Service form.
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
          display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '8px 0 16px', padding: '14px 16px', borderRadius: '10px',
          border: `1px solid ${consent ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`, background: consent ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)', transition: 'border-color .2s',
        }}
      >
        <input
          type="checkbox" id={id} checked={consent} onChange={(e) => setConsent(e.target.checked)}
          style={{ width: '18px', height: '18px', minWidth: '18px', marginTop: '2px', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <label htmlFor={id} style={{ fontSize: '14px', color: 'var(--tm)', lineHeight: 1.5, cursor: 'pointer' }}>
          I agree to receive updates about my request or service information via SMS, email, and phone from Bay Area Accounting Solutions.
          Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out at any time. View our{' '}
          <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link>.{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>*</span>
        </label>
      </div>
    </>
  );
}
