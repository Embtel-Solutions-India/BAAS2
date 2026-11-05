import { Link } from 'react-router-dom';
import { SMS_CONSENT_LABEL } from '../../utils/quote';

// Stand-alone, unticked, optional text-message opt-in for A2P 10DLC review. It is never combined with the
// email / privacy / terms consent, and links the Privacy Policy and SMS Terms from the same page as the form.
const link = { color: 'var(--accent)', textDecoration: 'underline' };

export default function SmsConsent({ id, checked, onChange, style }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '8px 0 14px', padding: '14px 16px', borderRadius: '10px',
        border: `1px solid ${checked ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`, background: checked ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)',
        textAlign: 'left', ...style,
      }}
    >
      <input
        type="checkbox" id={id} name="sms_consent" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', minWidth: '18px', margin: '2px 0 0', flexShrink: 0, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <label htmlFor={id} style={{ display: 'block', margin: 0, fontSize: '13px', color: 'var(--tm)', lineHeight: 1.5, cursor: 'pointer' }}>
        {SMS_CONSENT_LABEL} View our{' '}
        <Link to="/privacy-policy" target="_blank" style={link}>Privacy Policy</Link> and{' '}
        <Link to="/terms-and-conditions#sms-terms" target="_blank" style={link}>SMS Terms</Link>.
      </label>
    </div>
  );
}
