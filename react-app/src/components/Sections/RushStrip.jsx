import { Link } from 'react-router-dom';
import { RUSH_FROM, RUSH_PATH } from '../../data/rush';

// One-line rush note shown near the main CTA of each service page.
// Pass `service` (display name), or `special` for services without rush tiers.
export default function RushStrip({ service, special }) {
  return (
    <div className="container" style={{ padding: '0 var(--gut)' }}>
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px 14px', margin: '0 auto 8px',
          padding: '14px 20px', borderRadius: '12px', background: 'rgba(212,0,31,.05)', border: '1px solid rgba(212,0,31,.16)',
          fontSize: '15px', color: 'var(--tm)', textAlign: 'center',
        }}
      >
        <span>
          {special
            ? 'Same-day registered agent activation is included.'
            : <>Deadline coming up? <strong>Rush Service for {service}</strong> starts at {RUSH_FROM}.</>}
        </span>
        {!special && (
          <Link to={`${RUSH_PATH}#pricing`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>
            See rush pricing
          </Link>
        )}
      </div>
    </div>
  );
}
