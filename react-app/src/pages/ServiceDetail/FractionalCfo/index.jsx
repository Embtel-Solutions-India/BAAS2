import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Gauge, LineChart, Landmark, ShieldCheck, LayoutDashboard, RefreshCw, Phone, Mail, MapPin, Copy, Check } from 'lucide-react';
import RevealWrapper from '../../../components/UI/RevealWrapper';
import FaqItem from '../../../components/UI/FaqItem';
import PageHero from '../../../components/Sections/PageHero';
import CtaBar from '../../../components/Sections/CtaBar';
import SEOHead from '../../../components/SEO/SEOHead';
import { SITE_URL, serviceSchema, breadcrumbSchema } from '../../../components/SEO/seoConfig';

// Fractional CFO service page, converted from the standalone landing page.
// Uses the site's own header, footer and section styles; copy and FAQs live here so the page and its
// structured data always agree. Drop a headshot at public/virender-ahluwalia.jpg to replace the initials avatar.

const PATH = '/services/fractional-cfo';
const PHOTO = '/virender-ahluwalia.jpg';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const CFO_POINTS = [
  '25+ years as CFO, COO and CEO',
  'Pre-IPO, Fortune 500, startups and turnarounds',
  'Equity and debt capital raising',
  'Backed by the BAAS bookkeeping, tax and payroll team since 2006',
];

const PAINS = [
  ['Cash surprises', 'The P&L says you’re profitable, yet payroll week still makes your stomach drop. You need a 13-week cash forecast, not another month-end report.'],
  ['Decisions by gut', 'Hiring, pricing, a second location, a big equipment buy. Every call feels like a guess because nobody has modeled what it does to your numbers.'],
  ['Investors and lenders asking questions', 'A bank wants projections. An investor wants a data room. You need someone who has sat on the other side of that table.'],
];

const SERVICES = [
  [TrendingUp, 'Cash flow forecasting', 'Rolling 13-week and 12-month forecasts so you see a cash gap months before it arrives, with a plan to close it.'],
  [Gauge, 'Budgets and burn-rate control', 'An operating budget you actually use, monthly budget-versus-actual reviews, and spending guardrails that protect your runway.'],
  [LineChart, 'Financial models and business plans', 'Data-driven plans for growth, pricing, new locations or product lines, with realistic revenue assumptions you can defend.'],
  [Landmark, 'Capital raising', 'Investor-ready financials, pitch-deck numbers, lender packages, SBA and bank loan preparation, and support through due diligence.'],
  [ShieldCheck, 'Controls, governance and risk', 'Approval workflows, segregation of duties, board reporting and compliance frameworks that make a company audit-ready and well run.'],
  [LayoutDashboard, 'KPI dashboards and board reporting', 'A monthly CFO package with the five to ten numbers that matter for your business, explained in a short review meeting.'],
  [RefreshCw, 'Turnarounds and restructuring', 'When margins slip or debt gets heavy: cost reviews, vendor and lender negotiations, and a step-by-step recovery plan.'],
];

const CREDS = ['MBA', 'CPIM', 'Engineering background', 'Northeastern University'];

const CAREER = [
  ['2024 – now', 'Chief Financial Officer', 'MedWatch Technologies — medical device and SaaS'],
  ['2022 – now', 'General Partner', 'YES Labs — advisory and acceleration for SME ventures'],
  ['2022 – now', 'Entrepreneur in Residence', 'Pitch Global — financial leadership, Southeast Asia'],
  ['2020 – 2022', 'Chief Financial Officer', 'RC Global — supply chain services for CPG'],
  ['2019 – 2020', 'Chief Financial Officer', 'Coastal Holding Company — multi-subsidiary consumer products'],
  ['2017 – 2018', 'Executive Vice President', 'Sanovas — minimally invasive surgical technology'],
  ['2014 – 2017', 'EVP, Finance', 'Singularity University'],
  ['2010 – 2014', 'CFO and COO', 'Empowered World Ventures — STEM education media'],
  ['2008 – 2010', 'Chief Financial Officer', 'Rafter (BookRenter) — scaled from 5 to 150+ people'],
  ['2005 – 2008', 'Chief Executive Officer', 'FoBaz — venture-backed digital imaging startup'],
];

const ENGAGEMENTS = [
  { name: 'CFO Advisory', blurb: 'A senior finance partner on call for the big decisions.', fit: 'Good fit: owner-led businesses that want a sounding board.',
    items: ['Monthly strategy session', 'Review of your financials and KPIs', 'Email access for decisions in between'] },
  { name: 'Fractional CFO', blurb: 'Your part-time CFO, running finance alongside our bookkeeping team.', fit: 'Good fit: growing companies, roughly $1M–$25M in revenue.', featured: true,
    items: ['Rolling cash forecast and annual budget', 'Monthly CFO package and review meeting', 'Controls, pricing and hiring analysis', 'Lender and investor communication'] },
  { name: 'Project CFO', blurb: 'A focused engagement with a clear finish line.', fit: 'Good fit: a specific event in the next 3–6 months.',
    items: ['Fundraise or loan preparation', 'Financial model and business plan', 'Turnaround or cost-reduction plan', 'Due diligence and exit readiness'] },
];

const STEPS = [
  ['01', 'Strategy call', 'A free 30-minute conversation about where the business is and where you want it to go.'],
  ['02', 'Financial health review', 'We review your books, cash position and reporting. If the books need catch-up work, our cleanup team handles it first.'],
  ['03', 'CFO roadmap', 'Virender presents the priorities for the next 90 days and the engagement that fits.'],
  ['04', 'Monthly rhythm', 'Forecasts, reporting and review meetings on a set schedule, so you always know where you stand.'],
];

const FAQS = [
  ['What is a fractional CFO?', 'A fractional CFO is an experienced chief financial officer who works with your company part-time. You get senior-level strategy, forecasting and capital-raising support without the cost of a full-time executive salary and benefits.'],
  ['How is this different from bookkeeping or tax prep?', 'Bookkeeping records what happened and tax prep keeps you compliant. A CFO uses those records to plan ahead: cash forecasts, budgets, pricing, hiring and financing decisions. At BAAS you can have all three under one roof.'],
  ['When does a business need a CFO?', 'Common signs are steady growth with unpredictable cash, plans to raise money or take a loan, a big expansion decision, or an owner who spends too many nights worrying about the numbers. Earlier is usually better than later.'],
  ['My books are behind. Can I still start?', 'Yes. Our bookkeeping cleanup team brings your books current first, so your CFO works from numbers you can trust.'],
  ['Do you work with businesses outside the Bay Area?', 'Yes. We serve small and mid-sized businesses in all 50 states, with meetings held by video or in person in Fremont.'],
];

const SCHEMA = [
  serviceSchema({
    name: 'Fractional CFO Services',
    description: 'Part-time CFO services from Bay Area Accounting Solutions, led by Virender Ahluwalia: cash flow forecasting, budgets, financial models, capital raising and board reporting.',
    path: PATH,
  }),
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Fractional CFO', path: PATH },
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];

function SectionHeader({ label, title, sub }) {
  return (
    <div className="tc" style={{ marginBottom: '60px' }}>
      {label && <div className="slabel">{label}</div>}
      <h2 className="stitle">{title}</h2>
      {sub && <p className="ssub">{sub}</p>}
    </div>
  );
}

function CheckRow({ children }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14.5px', color: 'var(--tm)', marginBottom: '9px', lineHeight: 1.5 }}>
      <Check size={16} strokeWidth={2.6} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
      {children}
    </li>
  );
}

// Headshot with an initials fallback until the photo file is added to /public.
function Avatar({ size, fontSize, alt }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };
  if (failed) {
    return (
      <div className="serif" role="img" aria-label={alt} style={{ ...box, display: 'grid', placeItems: 'center', background: 'rgba(212,0,31,.08)', color: 'var(--accent)', fontSize }}>
        VA
      </div>
    );
  }
  return <img src={PHOTO} alt={alt} width={size} height={size} loading="lazy" onError={() => setFailed(true)} style={{ ...box, objectFit: 'cover' }} />;
}

function CopyRow({ icon: Icon, label, value, href, copy }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    try {
      navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
    } catch { /* clipboard unavailable; the value is still a link */ }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--cb)' }}>
      <Icon size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--td)', fontWeight: 600 }}>{label}</div>
        {href
          ? <a href={href} style={{ color: 'var(--accent)', fontSize: '15px', overflowWrap: 'anywhere' }}>{value}</a>
          : <span style={{ color: 'var(--tm)', fontSize: '15px' }}>{value}</span>}
      </div>
      {copy && (
        <button type="button" onClick={onCopy} className="btn-ol" style={{ padding: '6px 12px', fontSize: '13px', gap: '6px' }} aria-label={`Copy ${label}`}>
          <Copy size={13} aria-hidden="true" />{copied ? 'Copied' : 'Copy'}
        </button>
      )}
    </div>
  );
}

export default function FractionalCfo() {
  return (
    <>
      <SEOHead
        title="Fractional CFO Services, Cash Forecasting & Capital Raising | BAAS"
        description="Fractional CFO services from Bay Area Accounting Solutions, led by Virender Ahluwalia, 25+ years as CFO for startups, high-growth companies and turnarounds."
        url={`${SITE_URL}${PATH}`}
        type="website"
        structuredData={SCHEMA}
      />

      <PageHero
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }, { label: 'Fractional CFO' }]}
        label="Fractional CFO Services"
        title="You built the business. Now get a CFO who sees around corners."
        description="Clean books tell you what happened. A CFO tells you what happens next: when cash gets tight, what to cut, when to hire, and how to raise money on good terms. Get that seat filled part-time, for a fraction of a full-time salary."
        visual={
          <motion.div className="page-hero-visual" initial={{ opacity: 0, x: 40, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            <div className="hero-card" style={{ maxWidth: 380 }}>
              <div className="hero-card-line" aria-hidden="true" />
              <div className="hero-card-label">Your CFO</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--cb)' }}>
                <Avatar size={64} fontSize="22px" alt="Virender Ahluwalia" />
                <div>
                  <strong style={{ display: 'block', fontSize: '16px' }}>Virender Ahluwalia</strong>
                  <span style={{ fontSize: '14px', color: 'var(--td)' }}>Fractional CFO · MBA, CPIM</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {CFO_POINTS.map((t, i) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 0', borderBottom: i < CFO_POINTS.length - 1 ? '1px solid var(--cb)' : 'none' }}>
                    <Check size={18} strokeWidth={2.5} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} aria-hidden="true" />
                    <span style={{ fontSize: '14px', color: 'var(--tm)', lineHeight: 1.5 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        }
      />

      <section className="section bg-surface" style={{ paddingTop: '40px' }}>
        <div className="container">
          <SectionHeader label="Sound familiar?" title="Revenue is growing, and somehow the stress is too." />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="pain-grid">
            {PAINS.map(([t, d]) => (
              <motion.div variants={fadeUp} key={t} className="pain-card">
                <h3 className="serif" style={{ fontSize: '21px', marginBottom: '10px' }}>{t}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', lineHeight: 1.6 }}>{d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            label="What your CFO handles"
            title="Strategy, controls and capital, in plain English."
            sub="Our bookkeeping team keeps the records accurate. Your CFO turns them into decisions and reports to you every month."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {SERVICES.map(([Icon, h, p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <div className="feat-icon"><Icon size={25} strokeWidth={1.8} aria-hidden="true" /></div>
                <h3>{h}</h3>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-dark" id="virender">
        <div className="container">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(32px,5vw,64px)', alignItems: 'start' }}>
            <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <Avatar size={240} fontSize="64px" alt="Portrait of Virender Ahluwalia" />
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                {CREDS.map((c) => (
                  <span key={c} style={{ border: '1px solid var(--dark-border)', borderRadius: '999px', padding: '4px 14px', fontSize: '13px', color: '#fff' }}>{c}</span>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <div className="slabel">Meet your CFO</div>
              <h2 className="stitle" style={{ textAlign: 'left', marginBottom: '6px' }}>Virender Ahluwalia</h2>
              <p style={{ color: 'var(--dtm)', marginBottom: '22px' }}>Fractional CFO, Bay Area Accounting Solutions</p>
              <div style={{ display: 'grid', gap: '16px', maxWidth: '64ch', color: '#fff', fontSize: '16px', lineHeight: 1.7 }}>
                <p>Virender has spent more than 25 years in finance, operations and executive leadership, helping founders turn good ideas into durable, profitable companies. He has served as CFO for pre-IPO companies and Fortune 500 operations, as well as early-stage startups, high-growth ventures and turnarounds.</p>
                <p>His work centers on the fundamentals that keep companies alive and growing: cash flow forecasting, burn-rate control, grounded revenue assessment, strong financial controls, and raising equity and debt capital. As Entrepreneur in Residence at Pitch Global, he advises startups across Southeast Asia and the U.S. on financial leadership.</p>
                <p style={{ color: 'var(--dtm)' }}>He also serves on the board of Global Women Power as a financial advisor, and on the board of the DaanMatch non-profit technology platform.</p>
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dtm)', margin: '36px 0 8px' }}>Selected leadership roles</h3>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {CAREER.map(([yrs, role, co]) => (
                  <li key={`${yrs}-${co}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(96px,120px) 1fr', gap: '16px', padding: '12px 0', borderTop: '1px solid var(--dark-border)' }}>
                    <span style={{ color: 'var(--dtm)', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>{yrs}</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{role}<small style={{ display: 'block', fontWeight: 400, color: 'var(--dtm)', fontSize: '14px' }}>{co}</small></span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="section bg-surface" id="engagements">
        <div className="container">
          <SectionHeader label="Ways to work together" title="Pick the level of CFO support you need today." />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '22px', alignItems: 'stretch' }}>
            {ENGAGEMENTS.map((e) => (
              <motion.div
                variants={fadeUp} key={e.name} className="card-lg"
                style={{ display: 'flex', flexDirection: 'column', position: 'relative', ...(e.featured ? { border: '2px solid var(--accent)', boxShadow: '0 18px 40px rgba(212,0,31,.10)' } : {}) }}
              >
                {e.featured && (
                  <span style={{ position: 'absolute', top: '-13px', left: '28px', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    Most popular
                  </span>
                )}
                <h3 className="serif" style={{ fontSize: '26px', marginBottom: '6px' }}>{e.name}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', marginBottom: '18px', lineHeight: 1.5 }}>{e.blurb}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                  {e.items.map((it) => <CheckRow key={it}>{it}</CheckRow>)}
                </ul>
                <p style={{ fontSize: '14px', color: 'var(--td)', paddingTop: '14px', borderTop: '1px solid var(--cb)' }}>{e.fit}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader label="How it starts" title="From first call to first forecast in about 30 days." />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="steps-grid">
            {STEPS.map(([n, t, d]) => (
              <motion.div variants={fadeUp} key={n} className="step-card">
                <div className="step-bg" aria-hidden="true">{n}</div>
                <div className="step-num">{n}</div>
                <h3 className="serif" style={{ fontSize: '19px', marginBottom: '10px', position: 'relative' }}>{t}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', lineHeight: 1.6, position: 'relative' }}>{d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <SectionHeader label="Questions" title="Fractional CFO FAQ" />
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px', borderRadius: '20px', background: 'var(--card)', border: '1px solid var(--cb)' }}>
            {FAQS.map(([q, a]) => <FaqItem key={q} question={q} answer={a} />)}
          </div>
        </div>
      </section>

      <section className="section bg-white" id="contact">
        <div className="container">
          <RevealWrapper delay={0.1}>
            <div className="content-grid">
              <div className="prose">
                <h2>Know your numbers. Then know your next move.</h2>
                <p>Tell us about your business and we’ll set up a free 30-minute call with Virender. No pressure and no obligation.</p>
                <p>Behind on your books? Our team can bring them current first.{' '}
                  <Link to="/services/bookkeeping-cleanup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Learn about cleanup &rarr;</Link>
                </p>
              </div>
              <aside>
                <div className="sidebar-card">
                  <h4>Our Services</h4>
                  {[['Bookkeeping & Accounting', '/services/bookkeeping'], ['Business & Individual Taxes', '/services/tax-services'], ['Payroll Management', '/services/payroll'], ['Business Formation & Consulting', '/services/consulting'], ['Registered Agent', '/services/registered-agent'], ['Bookkeeping Cleanup', '/services/bookkeeping-cleanup']].map(([l, to]) => (
                    <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                  ))}
                </div>
                <div className="sidebar-card" style={{ marginTop: '20px' }}>
                  <h4>Contact</h4>
                  <CopyRow icon={Phone} label="Phone" value="(510) 962-7300" href="tel:+15109627300" copy />
                  <CopyRow icon={Mail} label="Email" value="info@bayareaaccountingsolutions.com" href="mailto:info@bayareaaccountingsolutions.com" copy />
                  <CopyRow icon={MapPin} label="Office" value="39159 Paseo Padre Pkwy, Suite 115, Fremont, CA" />
                </div>
              </aside>
            </div>
          </RevealWrapper>
        </div>
      </section>

      <CtaBar heading="Book your free CFO strategy call" sub="Tell us about your business and we’ll set up a free 30-minute call with Virender." />
    </>
  );
}
