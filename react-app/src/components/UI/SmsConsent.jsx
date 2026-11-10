import { Link } from 'react-router-dom';
import { SMS_CARE_LABEL, SMS_PROMO_LABEL } from '../../utils/quote';

// Two stand-alone, unticked, optional text-message opt-ins for A2P 10DLC review: one for service texts and a separate one
// for promotional texts. Neither is combined with the email / privacy / terms consent, and the Privacy Policy and
// SMS Terms are linked from the same page as the form. `value` = { care, promo }.
const link = { color: 'var(--accent)', textDecoration: 'underline' };

function Box({ id, name, checked, onChange, label, links }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '10px',
        border: `1px solid ${checked ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`, background: checked ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)',
        textAlign: 'left',
      }}
    >
      <input
        type="checkbox" id={id} name={name} checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', minWidth: '18px', margin: '2px 0 0', flexShrink: 0, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <label htmlFor={id} style={{ display: 'block', margin: 0, fontSize: '13px', color: 'var(--tm)', lineHeight: 1.5, cursor: 'pointer' }}>
        {label}{links && (
          <>
            {' '}View our <Link to="/privacy-policy" target="_blank" style={link}>Privacy Policy</Link> and{' '}
            <Link to="/terms-and-conditions#sms-terms" target="_blank" style={link}>SMS Terms</Link>.
          </>
        )}
      </label>
    </div>
  );
}

export default function SmsConsent({ id, value, onChange, style }) {
  const v = value || { care: false, promo: false };
  return (
    <div style={{ display: 'grid', gap: '10px', margin: '8px 0 14px', ...style }}>
      <Box id={`${id}_care`} name="sms_service_consent" checked={!!v.care} onChange={(care) => onChange({ ...v, care })} label={SMS_CARE_LABEL} />
      <Box id={`${id}_promo`} name="sms_marketing_consent" checked={!!v.promo} onChange={(promo) => onChange({ ...v, promo })} label={SMS_PROMO_LABEL} links />
    </div>
  );
}
