import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, FileWarning, Landmark, Plane, Briefcase, Building2, Users, Rocket, Phone, Mail, Check } from 'lucide-react';
import RevealWrapper from '../../../components/UI/RevealWrapper';
import FaqItem from '../../../components/UI/FaqItem';
import PageHero from '../../../components/Sections/PageHero';
import CtaBar from '../../../components/Sections/CtaBar';
import SEOHead from '../../../components/SEO/SEOHead';
import { SITE_URL, serviceSchema, breadcrumbSchema } from '../../../components/SEO/seoConfig';
import { BOOK_PATH } from '../../../data/booking';

// Foreign-owned U.S. LLC accounting ("Global Founders" program), converted from the standalone landing page.
// Uses the site's own header, footer and section styles; plans and FAQs live here so the page and its
// structured data always agree.

const PATH = '/services/foreign-owned-llc-accounting';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const IS_THIS_YOU = [
  'You’re on an E-2, L-1, EB-5, O-1 or H-1B and run a business',
  'You own a U.S. LLC from outside the country',
  'Your company is opening a U.S. subsidiary',
  'You’re not sure if you have to file Form 5472 or FBAR',
  'Your books are behind, and a visa renewal is coming',
];

const RISKS = [
  [FileWarning, '$25,000', 'Form 5472 penalty', 'Per form, per year, for foreign-owned U.S. companies that don’t file. Many single-member LLC owners have never heard of it.'],
  [Landmark, '$10,000+', 'FBAR penalties', 'Non-willful penalties for unreported foreign bank accounts can exceed $10,000 per violation. Accounts back home count.'],
  [Plane, '1 file', 'Your visa case', 'E-2 renewals, L-1 new-office extensions and EB-5 filings lean on your business financials. Inconsistent books are hard to defend.'],
];

const WHO = [
  [Briefcase, 'E-2 investors', 'Clean books and statements for renewal season.'],
  [Building2, 'L-1 executives', 'U.S. office financials that show real operations.'],
  [Landmark, 'EB-5 investors', 'Organized records for your business and job creation.'],
  [Globe, 'Non-resident LLC owners', 'Form 5472, pro forma 1120 and U.S. banking setup.'],
  [Users, 'Foreign subsidiaries', 'Entity setup, payroll and parent-company reporting.'],
  [Rocket, 'H-1B & O-1 side founders', 'Startups done right from the first dollar.'],
];

const PLANS = [
  { name: 'Launch', blurb: 'Register a company in the USA from India or anywhere abroad.', price: '$1,495', unit: '', note: 'One-time, plus state filing fees', cta: 'Start with Launch', schemaPrice: '1495',
    desc: 'Company formation, EIN, ITIN application preparation, 1 year registered agent, bank-ready chart of accounts. State fees extra.',
    items: ['LLC or corporation formation, any state', 'EIN from the IRS', 'ITIN application preparation', 'Registered agent for 1 year', 'Bank-ready chart of accounts'] },
  { name: 'Operate', blurb: 'For running businesses with a foreign owner.', price: '$450', unit: '/month', note: 'Flat monthly fee', cta: 'Choose Operate', featured: true, schemaPrice: '450',
    desc: 'Monthly bookkeeping, quarterly financial statements, annual Form 5472 with pro forma 1120, FBAR filing.',
    items: ['Monthly bookkeeping in QuickBooks', 'Quarterly financial statements', 'Annual Form 5472 + pro forma 1120', 'FBAR filing', 'A dedicated accountant you can call'] },
  { name: 'Grow', blurb: 'For E-2, L-1 and EB-5 clients and teams with employees.', price: '$850', unit: '/month', note: 'Flat monthly fee', cta: 'Choose Grow', schemaPrice: '850',
    desc: 'Everything in Operate plus payroll for up to 5 employees, business tax return and a visa-support financial package.',
    items: ['Everything in Operate', 'Payroll for up to 5 employees', 'Business income tax return', 'Visa-support financial package', 'Coordination with your immigration team'] },
];

const ROOF_THEM = ['Unfamiliar with Form 5472 and FBAR', 'Never speaks to your immigration team', 'Bills by the hour', 'Learns about your visa deadline too late'];
const ROOF_US = ['Cross-border filings are our specialty', 'Works alongside your immigration team', 'One flat monthly price', 'Financials ready before your renewal'];

const STEPS = [
  ['01', 'Free call', '20 minutes by phone or video. We learn your business, visa and filings.'],
  ['02', 'Fixed quote', 'Your exact price in writing within 2 business days. No obligation.'],
  ['03', 'Setup & catch-up', 'We connect your accounts and bring any past records current.'],
  ['04', 'Monthly peace of mind', 'Books closed every month, filings on time, reports ready when you need them.'],
];

const FAQS = [
  ['Do I need to live in the U.S. to work with BAAS?', 'No. We work with founders in the U.S. and abroad. Meetings are by video, documents are signed electronically, and we serve companies in all 50 states.'],
  ['What is Form 5472 and do I need to file it?', 'Form 5472 is an IRS information return for U.S. companies that are 25% or more foreign-owned, including single-member LLCs owned by a foreign person. Missing it can trigger a $25,000 penalty per form, per year. We’ll confirm on your free call whether it applies to you.'],
  ['Can you help with financials for my E-2, L-1 or EB-5 case?', 'Yes. We prepare bookkeeping, financial statements and payroll records that your immigration attorney or consultant can use. We coordinate with your immigration team, but we don’t provide immigration legal advice.'],
  ['I’m behind on my books. Can I still join?', 'Yes. Catch-up and cleanup bookkeeping is one of our specialties. We’ll quote a fixed price to bring your books current before your monthly plan starts.'],
  ['Are the prices fixed?', 'Yes. You get a flat monthly fee, never hourly billing. We confirm your exact price in writing after the free call, before you commit.'],
  ['Can I register a company in the USA from India?', 'Yes. Our Launch plan forms your U.S. LLC or corporation in any state, gets your EIN, and prepares your ITIN application, all remotely. Founders from India, Bangladesh, the UAE and elsewhere use it.'],
  ['What is a pro forma 1120?', 'A foreign-owned single-member LLC files Form 5472 attached to a “pro forma” Form 1120, a simplified corporate return used only to submit the 5472. It’s included in our Operate and Grow plans.'],
  ['What do I need for my E-2 visa renewal?', 'Officers review whether your business is real and operating. Clean bookkeeping, financial statements, payroll records and tax returns help show that. We prepare these and coordinate with your immigration team.'],
];

const SCHEMA = [
  {
    ...serviceSchema({
      name: 'Accounting for Foreign-Owned U.S. LLCs',
      description: 'Form 5472 and FBAR filing, bookkeeping and U.S. company registration for non-residents and foreign-owned LLCs, with E-2 and EB-5 ready financials.',
      path: PATH,
    }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Global Founders Plans',
      itemListElement: PLANS.map((p) => ({
        '@type': 'Offer',
        name: p.name,
        description: p.desc,
        price: p.schemaPrice,
        priceCurrency: 'USD',
        ...(p.unit ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: p.schemaPrice, priceCurrency: 'USD', unitText: 'MONTH' } } : {}),
      })),
    },
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Foreign-Owned LLC Accounting', path: PATH },
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

export default function ForeignOwned() {
  return (
    <>
      <SEOHead
        title="Foreign-Owned LLC Accounting, Form 5472 & FBAR | BAAS"
        description="Form 5472 and FBAR filing, bookkeeping and U.S. company registration for non-residents and foreign-owned LLCs. E-2 and EB-5 ready financials. Flat pricing."
        url={`${SITE_URL}${PATH}`}
        type="website"
        structuredData={SCHEMA}
      />

      <PageHero
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }, { label: 'Foreign-Owned LLC Accounting' }]}
        label="BAAS Global Founders"
        title="Accounting for foreign-owned U.S. LLCs."
        description="You built a business in America. We keep the IRS and your visa file happy. U.S. company registration for non-residents, bookkeeping, Form 5472, FBAR filing, payroll and E-2/EB-5 ready financials, at one flat monthly price."
        visual={
          <motion.div className="page-hero-visual" initial={{ opacity: 0, x: 40, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            <div className="hero-card" style={{ maxWidth: 380 }}>
              <div className="hero-card-line" aria-hidden="true" />
              <div className="hero-card-label">Is this you?</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {IS_THIS_YOU.map((t, i) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 0', borderBottom: i < IS_THIS_YOU.length - 1 ? '1px solid var(--cb)' : 'none' }}>
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
          <div className="tc" style={{ marginBottom: '48px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px 28px', fontSize: '15px', color: 'var(--tm)' }}>
            <span><strong>Since 2006</strong> in the Bay Area</span>
            <span><strong>All 50 states</strong> served</span>
            <span><strong>QuickBooks</strong>-certified</span>
          </div>
          <SectionHeader
            label="The hidden risk"
            title="Form 5472 and FBAR: the rules are different for foreign owners."
            sub="Most founders find out the hard way. A missed form or messy books can cost real money, and they can raise questions on your next immigration filing."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="pain-grid">
            {RISKS.map(([Icon, big, t, d]) => (
              <motion.div variants={fadeUp} key={t} className="pain-card">
                <div style={{ color: 'var(--accent)', marginBottom: '10px' }}><Icon size={28} strokeWidth={1.6} aria-hidden="true" /></div>
                <div className="serif" style={{ fontSize: '38px', color: 'var(--accent)', lineHeight: 1, marginBottom: '10px' }}>{big}</div>
                <h3 className="serif" style={{ fontSize: '19px', marginBottom: '8px' }}>{t}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', lineHeight: 1.6 }}>{d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader label="Who we serve" title="U.S. LLCs for non-residents, E-2, L-1 and EB-5 founders." />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="feat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
            {WHO.map(([Icon, h, p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <div className="feat-icon"><Icon size={25} strokeWidth={1.8} aria-hidden="true" /></div>
                <h3>{h}</h3>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-surface" id="plans">
        <div className="container">
          <SectionHeader
            label="Plans & pricing"
            title="Flat-price plans for non-resident LLC owners."
            sub="Start with Launch if you’re setting up, or go straight to a monthly plan if your business is already running."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '22px', alignItems: 'stretch' }}>
            {PLANS.map((p) => (
              <motion.div
                variants={fadeUp} key={p.name} className="card-lg"
                style={{ display: 'flex', flexDirection: 'column', position: 'relative', ...(p.featured ? { border: '2px solid var(--accent)', boxShadow: '0 18px 40px rgba(212,0,31,.10)' } : {}) }}
              >
                {p.featured && (
                  <span style={{ position: 'absolute', top: '-13px', left: '28px', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    Most popular
                  </span>
                )}
                <h3 className="serif" style={{ fontSize: '28px', marginBottom: '4px' }}>{p.name}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', marginBottom: '18px', minHeight: '46px', lineHeight: 1.5 }}>{p.blurb}</p>
                <div style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1, marginBottom: '4px', color: '#1a1a1a' }}>
                  {p.price}{p.unit && <small style={{ fontSize: '16px', fontWeight: 500, color: 'var(--td)' }}>{p.unit}</small>}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--td)', marginBottom: '22px' }}>{p.note}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                  {p.items.map((it) => <CheckRow key={it}>{it}</CheckRow>)}
                </ul>
                <Link to={BOOK_PATH} className={p.featured ? 'btn-pl' : 'btn-ol'} style={{ justifyContent: 'center', textAlign: 'center' }}>{p.cta}</Link>
              </motion.div>
            ))}
          </motion.div>
          <p className="tc" style={{ marginTop: '24px', fontSize: '15px', color: 'var(--td)' }}>
            Behind on your books? We’ll quote a fixed price to catch you up first.{' '}
            <Link to="/services/bookkeeping-cleanup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Learn about cleanup &rarr;</Link>
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            label="Why BAAS"
            title="Your accounting and immigration teams, under one roof."
            sub="BAAS is part of the same family of companies as Bay Area Immigration Services. Your numbers and your case tell the same story."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '22px' }}>
            <motion.div variants={fadeUp} className="card-lg">
              <h3 className="serif" style={{ fontSize: '22px', marginBottom: '14px', color: 'var(--td)' }}>A typical accountant</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {ROOF_THEM.map((t, i) => (
                  <li key={t} style={{ padding: '10px 0', borderBottom: i < ROOF_THEM.length - 1 ? '1px solid var(--cb)' : 'none', color: 'var(--td)', fontSize: '15.5px' }}>{t}</li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={fadeUp} className="card-lg" style={{ border: '2px solid var(--accent)' }}>
              <h3 className="serif" style={{ fontSize: '22px', marginBottom: '14px', color: 'var(--accent)' }}>BAAS Global Founders</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {ROOF_US.map((t, i) => (
                  <li key={t} style={{ padding: '10px 0', borderBottom: i < ROOF_US.length - 1 ? '1px solid var(--cb)' : 'none', color: 'var(--tm)', fontSize: '15.5px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Check size={17} strokeWidth={2.6} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />{t}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <SectionHeader label="How it works" title="From first call to clean books in four steps." />
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

      <section className="section bg-white">
        <div className="container">
          <SectionHeader label="Questions" title="Common questions from founders." />
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px', borderRadius: '20px', background: 'var(--card)', border: '1px solid var(--cb)' }}>
            {FAQS.map(([q, a]) => <FaqItem key={q} question={q} answer={a} />)}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <RevealWrapper delay={0.1}>
            <div className="content-grid">
              <div className="prose">
                <h2>Let’s look at your business together</h2>
                <p>Tell us where you are, and we’ll tell you exactly which filings you need, what’s at risk, and what it costs to get it right. The first call is free, 20 minutes, with no pressure and no obligation.</p>
                <p style={{ fontSize: '14px', color: 'var(--td)' }}>
                  Bay Area Accounting Solutions provides bookkeeping, tax and accounting services. We do not provide immigration legal advice; immigration legal advice is provided only by licensed attorneys. Penalty amounts are general IRS figures and may change; your situation will be reviewed individually.
                </p>
              </div>
              <aside>
                <div className="sidebar-card">
                  <h4>Our Services</h4>
                  {[['Business Formation & Consulting', '/services/consulting'], ['Registered Agent', '/services/registered-agent'], ['Bookkeeping & Accounting', '/services/bookkeeping'], ['Business & Individual Taxes', '/services/tax-services'], ['Payroll Management', '/services/payroll'], ['Bookkeeping Cleanup', '/services/bookkeeping-cleanup']].map(([l, to]) => (
                    <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                  ))}
                </div>
                <div className="sidebar-card" style={{ marginTop: '20px' }}>
                  <h4>Contact</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '15px', color: 'var(--tm)' }}>
                    <Phone size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" /> <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--tm)' }}>
                    <Mail size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" /> <a href="mailto:info@bayareaaccountingsolutions.com" style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>info@bayareaaccountingsolutions.com</a>
                  </div>
                </div>
              </aside>
            </div>
          </RevealWrapper>
        </div>
      </section>

      <CtaBar heading="Book your free 20-minute call" sub="Tell us where you are and we’ll tell you exactly which filings you need, what’s at risk, and what it costs to get it right." />
    </>
  );
}
