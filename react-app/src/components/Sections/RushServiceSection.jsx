import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { openRushModal } from './RushRequestModal';
import { BookOpen, Calculator, Users, Building2, ShieldCheck, FileText } from 'lucide-react';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

const CATALOG = [
  { Icon: BookOpen, label: 'Bookkeeping & Accounting', to: '/services/bookkeeping' },
  { Icon: Calculator, label: 'Business & Individual Taxes', to: '/services/tax-services' },
  { Icon: Users, label: 'Payroll Management', to: '/services/payroll' },
  { Icon: Building2, label: 'Business Formation', to: '/services/consulting' },
  { Icon: ShieldCheck, label: 'Registered Agent', to: '/services/registered-agent' },
  { Icon: FileText, label: 'Accounting Cleanup', to: '/services/accounting' },
];

const POINTS = [
  {
    title: 'Expedited turnaround',
    desc: 'Work completed in a shorter timeframe than our standard schedule.',
    icon: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></>,
  },
  {
    title: 'Priority handling',
    desc: 'Urgent requests are moved to the front of the queue by our team.',
    icon: <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>,
  },
  {
    title: 'Clear answer upfront',
    desc: 'We confirm what is feasible before we begin, so there are no surprises.',
    icon: <path d="M4 10l4 4 8-8"/>,
  },
];

const intentLabel = { fontSize: '14px', color: 'var(--td)', marginBottom: '12px' };
const intentBtn = { justifyContent: 'center', width: '100%', maxWidth: '300px', whiteSpace: 'nowrap', padding: '16px 18px', fontSize: '16px' };

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
            Facing a tight deadline or an urgent requirement? Our Rush Service is an expedited option for
            clients who need their work completed in a shorter timeframe. Reach out as early as you can and we
            will let you know what we can do.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '20px', maxWidth: '980px', margin: '0 auto' }}>
          {POINTS.map(({ title, desc, icon }, i) => (
            <motion.div
              key={title} className="card-lg"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div style={{ fontSize: '28px', marginBottom: '14px', color: 'var(--accent)' }}>
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
              </div>
              <h3 className="serif" style={{ fontSize: '20px', marginBottom: '8px' }}>{title}</h3>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--td)', margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Small services catalog */}
        <div style={{ margin: '48px auto 0', maxWidth: '860px' }}>
          <div className="tc" style={{ marginBottom: '20px', fontSize: '13px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--tf)' }}>
            Rush support available across our services
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px' }}>
            {CATALOG.map(({ Icon, label, to }) => (
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

        {/* All actions together, one per user intent */}
        <div style={{ margin: '56px auto 0', maxWidth: '860px', paddingTop: '40px', borderTop: '1px solid var(--cb)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '28px 24px', textAlign: 'center' }}>
            <div>
              <div style={intentLabel}>Deadline coming up?</div>
              <button type="button" onClick={openRushModal} className="btn-pl" style={intentBtn}>
                Request Rush Service
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div>
              <div style={intentLabel}>Planning ahead?</div>
              <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-ol" style={intentBtn}>
                Book a Free Consultation
              </a>
            </div>
            <div>
              <div style={intentLabel}>Prefer to talk now?</div>
              <a href="tel:+15109627300" className="btn-ol" style={intentBtn}>
                Call (510) 962-7300
              </a>
            </div>
          </div>
          <p className="tc" style={{ marginTop: '28px', fontSize: '13px', color: 'var(--tf)' }}>
            Rush Service is subject to feasibility and availability.
          </p>
        </div>
      </div>
    </section>
  );
}
