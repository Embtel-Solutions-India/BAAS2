import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, Users, Building2, ShieldCheck, FileText } from 'lucide-react';
import { RUSH_TIERS, RUSH_PATH, RUSH_SMALL_PRINT, PHONE_TEL, PHONE_DISPLAY, tierPriceLine } from '../../data/rush';
import { trackRush } from '../../utils/rush';

// Home page rush section. Prices/timelines come from data/rush.js (single source of truth).
const LINKS = [
  { Icon: BookOpen, label: 'Bookkeeping & Accounting', to: '/services/bookkeeping' },
  { Icon: Calculator, label: 'Business & Individual Taxes', to: '/services/tax-services' },
  { Icon: Users, label: 'Payroll Management', to: '/services/payroll' },
  { Icon: Building2, label: 'Business Formation', to: '/services/consulting' },
  { Icon: FileText, label: 'Accounting Cleanup', to: '/services/accounting' },
  { Icon: ShieldCheck, label: 'Registered Agent (same-day activation included)', to: '/services/registered-agent' },
];

export default function RushServiceSection() {
  return (
    <section className="section bg-surface" id="rush-service" aria-labelledby="rush-service-title" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="hero-light-glow" aria-hidden="true" />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="tc" style={{ maxWidth: '760px', margin: '0 auto 48px' }}
        >
          <div className="slabel">Need it done fast?</div>
          <h2 className="stitle" id="rush-service-title">Rush Service for urgent deadlines</h2>
          <p className="ssub" style={{ marginTop: '16px' }}>
            Clear prices and timelines, confirmed in writing before we start. Rush fees are added to the standard service price.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '20px', maxWidth: '980px', margin: '0 auto' }}>
          {RUSH_TIERS.map((t, i) => (
            <motion.div
              key={t.id} className="card-lg"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ position: 'relative', textAlign: 'center', ...(t.badge ? { borderColor: 'rgba(212,0,31,.35)' } : {}) }}
            >
              {t.badge && (
                <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                  {t.badge}
                </span>
              )}
              <h3 className="serif" style={{ fontSize: '22px', marginBottom: '6px' }}>{t.name}</h3>
              <p style={{ fontSize: '15px', color: 'var(--td)', margin: '0 0 14px' }}>{t.timeline}</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>{tierPriceLine(t)}</p>
              {t.note && <p style={{ fontSize: '13px', color: 'var(--tf)', margin: '10px 0 0' }}>{t.note}</p>}
            </motion.div>
          ))}
        </div>

        {/* Services rush is available for */}
        <div style={{ margin: '48px auto 0', maxWidth: '860px' }}>
          <div className="tc" style={{ marginBottom: '20px', fontSize: '15px', fontWeight: 600, color: 'var(--tm)' }}>
            Rush available for:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px' }}>
            {LINKS.map(({ Icon, label, to }) => (
              <Link
                key={label} to={to} className="ind-tag"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', fontWeight: 500, color: 'var(--tm)' }}
              >
                <Icon size={22} color="var(--accent)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* One primary action, plus a text link and the phone number */}
        <div className="tc" style={{ margin: '48px auto 0', maxWidth: '860px' }}>
          <div className="cta-buttons" style={{ justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '16px 28px' }}>
            <Link to={`${RUSH_PATH}#pricing`} className="btn-pl" style={{ whiteSpace: 'nowrap' }} onClick={() => trackRush('rush_section_cta_click', { button_label: 'See rush pricing' })}>
              See rush pricing
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link to={`${RUSH_PATH}#request`} onClick={() => trackRush('rush_section_cta_click', { button_label: 'Request Rush Service' })} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '16px', textDecoration: 'underline' }}>
              Request Rush Service
            </Link>
            <a href={PHONE_TEL} onClick={() => trackRush('rush_call_click', { location: 'home_rush_section' })} style={{ color: 'var(--tm)', fontSize: '16px' }}>Call {PHONE_DISPLAY}</a>
          </div>
          <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--tf)', lineHeight: 1.6 }}>{RUSH_SMALL_PRINT}</p>
        </div>
      </div>
    </section>
  );
}
