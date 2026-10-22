import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FaqItem from '../../components/UI/FaqItem';
import RushRequestForm from '../../components/Sections/RushRequestForm';
import SEOHead from '../../components/SEO/SEOHead';
import { SITE_URL, breadcrumbSchema } from '../../components/SEO/seoConfig';
import { trackRush } from '../../utils/rush';
import {
  RUSH_PATH, RUSH_TIERS, RUSH_STEPS, RUSH_PACKAGES, RUSH_RULES_TITLE, RUSH_RULES_LIST, RUSH_RULES_NOTE, RUSH_DISCLAIMER,
  LANDING_FAQS, LANDING, FORM_MESSAGES, PRICING_ROWS, PRICING_COLUMNS, PRICING_FOOTNOTES, TIER_FOOTER, PHONE_TEL, PHONE_DISPLAY,
  PHONE_HOURS, ADDRESS,
} from '../../data/rush';

// ---- Structured data (spec section 10). Prices come from data/rush.js so they never drift. ----
const PROVIDER = {
  '@type': 'AccountingService',
  name: 'Bay Area Accounting Solutions',
  telephone: '+1 510 962 7300',
  address: { '@type': 'PostalAddress', streetAddress: '39159 Paseo Padre Parkway, Suite 115', addressLocality: 'Fremont', addressRegion: 'CA', postalCode: '94538', addressCountry: 'US' },
};
const SERVICE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Rush Bookkeeping, Tax & Payroll Service',
  url: `${SITE_URL}${RUSH_PATH}`,
  provider: PROVIDER,
  areaServed: { '@type': 'Country', name: 'United States' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Rush Service tiers and packages',
    itemListElement: [
      ...RUSH_TIERS.map((t) => ({
        '@type': 'Offer',
        name: `${t.name} rush (${t.timeline})`,
        description: `${t.price} of the standard service price, minimum fee $${t.min}. ${t.timeline}, business days, Pacific Time.`,
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'PriceSpecification', minPrice: t.min, priceCurrency: 'USD' },
      })),
      ...RUSH_PACKAGES.map((p) => ({
        '@type': 'Offer',
        name: p.title,
        description: `${p.description} ${p.timeline}.`,
        priceCurrency: 'USD',
        ...(p.schemaPrice ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: p.schemaPrice, priceCurrency: 'USD' } } : {}),
      })),
    ],
  },
};
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LANDING_FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};
const SCHEMA = [
  SERVICE_SCHEMA,
  FAQ_SCHEMA,
  breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Rush Service', path: RUSH_PATH }]),
];

// ---- Small style helpers ---------------------------------------------------------------------
const anchorMargin = { scrollMarginTop: '124px' };
const th = { textAlign: 'left', padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#1a1a1a', background: 'rgba(0,0,0,.03)', borderBottom: '1px solid var(--cb)', verticalAlign: 'bottom' };
const td = { padding: '14px 16px', fontSize: '14px', color: 'var(--tm)', borderBottom: '1px solid var(--cb)', verticalAlign: 'top', lineHeight: 1.5 };
const head = (label, title, sub) => (
  <div className="tc" style={{ marginBottom: '44px' }}>
    {label && <div className="slabel">{label}</div>}
    <h2 className="stitle">{title}</h2>
    {sub && <p className="ssub">{sub}</p>}
  </div>
);
const arrow = (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

export default function RushService() {
  const [prefill, setPrefill] = useState({});
  const [heroPassed, setHeroPassed] = useState(false);
  const [formInView, setFormInView] = useState(false);
  const heroRef = useRef(null);
  const requestRef = useRef(null);

  // Tier / package buttons: pre-select the form fields, then scroll to #request.
  const requestWith = useCallback((opts) => {
    setPrefill({ ...opts, nonce: Date.now() });
    const el = document.getElementById('request');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Sticky mobile button: shown after the hero scrolls away, hidden while the form is on screen.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const heroObs = new IntersectionObserver(([e]) => setHeroPassed(!e.isIntersecting && e.boundingClientRect.top < 0));
    const formObs = new IntersectionObserver(([e]) => setFormInView(e.isIntersecting));
    if (heroRef.current) heroObs.observe(heroRef.current);
    if (requestRef.current) formObs.observe(requestRef.current);
    return () => { heroObs.disconnect(); formObs.disconnect(); };
  }, []);

  // rush_call_click: any tel: link on this page (hero, side panel, footer, ...)
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target instanceof Element ? e.target.closest('a[href^="tel:"]') : null;
      if (!a) return;
      const where = a.closest('#top') ? 'rush_page_hero' : a.closest('#request') ? 'rush_page_side_panel' : a.closest('footer') ? 'footer' : 'rush_page';
      trackRush('rush_call_click', { location: where });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <SEOHead
        title={LANDING.title}
        description={LANDING.description}
        url={`${SITE_URL}${RUSH_PATH}`}
        type="website"
        structuredData={SCHEMA}
      />

      {/* 1. Hero */}
      <section className="page-hero-light" id="top" ref={heroRef} style={{ minHeight: 'auto' }}>
        <div className="hero-light-glow" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '780px' }}>
            <div className="breadcrumb" style={{ marginBottom: '18px', fontSize: '15px', display: 'flex', gap: '8px' }}>
              <Link to="/" style={{ color: 'var(--accent)' }}>Home</Link><span style={{ opacity: 0.4 }}>›</span><span style={{ color: 'var(--td)' }}>Rush Service</span>
            </div>
            <div className="slabel" style={{ marginBottom: '12px' }}>Rush Service</div>
            <h1 className="page-hero-title">{LANDING.h1}</h1>
            <p className="page-hero-desc">{LANDING.sub}</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', marginTop: '28px' }}>
              <a href="#request" className="btn-pl" onClick={() => setPrefill({ source: 'hero', nonce: Date.now() })} style={{ padding: '14px 28px', fontSize: '16px' }}>
                Request Rush Service {arrow}
              </a>
              <a href={PHONE_TEL} style={{ color: 'var(--tm)', fontSize: '16px', textDecoration: 'underline' }}>Call {PHONE_DISPLAY}</a>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', display: 'flex', flexWrap: 'wrap', gap: '8px 22px', fontSize: '14px', color: 'var(--td)' }}>
              {LANDING.trust.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* 2. How rush works */}
      <section className="section bg-surface" id="how-it-works" style={anchorMargin}>
        <div className="container">
          {head('How it works', 'How rush works')}
          <ol className="rush-steps" style={{ listStyle: 'none', padding: 0, margin: '0 auto', maxWidth: '1000px' }}>
            {RUSH_STEPS.map((s, i) => (
              <motion.li key={s.title} className="card-lg" {...fade} transition={{ duration: 0.5, delay: i * 0.08 }} style={{ padding: '24px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>{i + 1}</div>
                <h3 className="serif" style={{ fontSize: '19px', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', lineHeight: 1.6, margin: 0 }}>{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. Rush tiers */}
      <section className="section" id="tiers" style={anchorMargin}>
        <div className="container">
          {head('Rush tiers', 'Pick the timeline you need', 'The fee is a percentage of the standard service price, with a minimum.')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '22px', maxWidth: '1000px', margin: '0 auto' }}>
            {RUSH_TIERS.map((t, i) => (
              <motion.div
                key={t.id} className="card-lg" {...fade} transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'center', ...(t.id === 'express' ? { borderColor: 'rgba(212,0,31,.45)', boxShadow: '0 12px 40px rgba(212,0,31,.12)' } : {}) }}
              >
                {t.badge && (
                  <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', whiteSpace: 'nowrap' }}>{t.badge}</span>
                )}
                {t.note && (
                  <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', whiteSpace: 'nowrap' }}>{t.note}</span>
                )}
                <h3 className="serif" style={{ fontSize: '24px', marginBottom: '6px' }}>{t.name}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', margin: '0 0 16px' }}>{t.timeline}</p>
                <p style={{ fontSize: '26px', fontWeight: 700, color: 'var(--accent)', margin: '0 0 4px' }}>{t.price} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--td)' }}>of service price</span></p>
                <p style={{ fontSize: '14px', color: 'var(--tm)', margin: '0 0 16px' }}>Minimum fee: ${t.min}</p>
                <p style={{ fontSize: '14px', color: 'var(--td)', margin: '0 0 20px', flex: 1 }}><strong style={{ color: 'var(--tm)' }}>Best for:</strong> {t.bestFor}</p>
                <button
                  type="button" className="btn-pl" style={{ justifyContent: 'center', width: '100%', padding: '14px 18px', fontSize: '16px' }}
                  onClick={() => { trackRush('rush_tier_click', { tier: t.name }); requestWith({ tier: t.name, source: `tier: ${t.name}` }); }}
                >
                  {t.button}
                </button>
                <p style={{ fontSize: '12px', color: 'var(--tf)', margin: '14px 0 0', lineHeight: 1.5 }}>{TIER_FOOTER}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Rush pricing by service */}
      <section className="section bg-surface" id="pricing" style={anchorMargin}>
        <div className="container">
          {head('Rush pricing', 'Rush pricing by service', 'Rush fees are shown as "from" amounts because they scale with the standard price. All timelines are business days, Pacific Time.')}
          <div style={{ maxWidth: '1100px', margin: '0 auto', overflowX: 'auto', border: '1px solid var(--cb)', borderRadius: '16px', background: '#fff' }} tabIndex={0} role="region" aria-label="Rush pricing by service (scrolls sideways on small screens)">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
              <thead>
                <tr>{PRICING_COLUMNS.map((c) => <th key={c} scope="col" style={th}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {PRICING_ROWS.map((r) => (
                  <tr key={r.id} id={`pricing-${r.id}`} style={anchorMargin}>
                    <th scope="row" style={{ ...td, fontWeight: 600, color: '#1a1a1a', textAlign: 'left' }}>{r.service}</th>
                    <td style={td}>{r.standard}</td>
                    <td style={td}>{r.priority}</td>
                    <td style={td}>{r.express}</td>
                    <td style={td}>{r.emergency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul style={{ maxWidth: '1100px', margin: '18px auto 0', padding: '0 0 0 18px', fontSize: '13px', color: 'var(--td)', lineHeight: 1.7 }}>
            {PRICING_FOOTNOTES.map((f) => <li key={f} style={{ marginBottom: '4px' }}>{f}</li>)}
          </ul>
        </div>
      </section>

      {/* 5. Rush packages */}
      <section className="section" id="packages" style={anchorMargin}>
        <div className="container">
          {head('Rush packages', 'Rush packages', 'Ready-made rush options for common deadlines.')}
          <div className="rush-pkg-grid" style={{ maxWidth: '1180px', margin: '0 auto' }}>
            {RUSH_PACKAGES.map((p, i) => (
              <motion.article key={p.id} className="card-lg" {...fade} transition={{ duration: 0.5, delay: (i % 2) * 0.08 }} style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="serif" style={{ fontSize: '22px', marginBottom: '6px' }}>{p.title}</h3>
                <p style={{ fontSize: '15px', color: 'var(--td)', margin: '0 0 14px' }}>{p.description}</p>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tm)', marginBottom: '6px' }}>What&apos;s included</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                  {p.included.map((b) => (
                    <li key={b} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--tm)', marginBottom: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '3px' }}><path d="M4 10l4 4 8-8" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {b}
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '14px', color: 'var(--tm)', margin: '0 0 6px' }}><strong>Timeline:</strong> {p.timeline}</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>{p.price}</p>
                {p.smallPrint && <p style={{ fontSize: '12px', color: 'var(--tf)', margin: '0 0 16px', lineHeight: 1.5 }}>{p.smallPrint}</p>}
                <div style={{ flex: 1 }} />
                <button
                  type="button" className="btn-pl" style={{ justifyContent: 'center', width: '100%', padding: '14px 18px', fontSize: '16px' }}
                  onClick={() => { trackRush('rush_package_click', { package: p.title }); requestWith({ service: p.service, source: `package: ${p.title}` }); }}
                >
                  {p.button}
                </button>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* 6 + 7. Rush rules (left) and request form (right), side by side */}
      <section className="section bg-surface" id="rules" style={anchorMargin}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          <div className="rush-rules-request">
            {/* Left: rules */}
            <div>
              <div style={{ marginBottom: '28px' }}>
                <div className="slabel">Rules</div>
                <h2 className="stitle" style={{ textAlign: 'left' }}>{RUSH_RULES_TITLE}</h2>
              </div>
              <div style={{ background: 'rgba(0,0,0,.035)', borderRadius: '16px', padding: 'clamp(20px,3vw,32px)' }}>
                <ol style={{ margin: 0, paddingLeft: '24px', listStyle: 'decimal outside', display: 'grid', gap: '12px', fontSize: '15px', color: 'var(--tm)', lineHeight: 1.6 }}>
                  {RUSH_RULES_LIST.map(([lead, rest]) => (
                    <li key={lead} style={{ display: 'list-item', paddingLeft: '4px' }}><strong style={{ color: '#1a1a1a' }}>{lead}</strong> {rest}</li>
                  ))}
                </ol>
                <p style={{ margin: '20px 0 0', fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{RUSH_RULES_NOTE}</p>
              </div>
              {/* What happens after submitting (steps from the data file) */}
              <div style={{ marginTop: '24px', padding: 'clamp(20px,3vw,28px)', borderRadius: '16px', background: '#fff', border: '1px solid var(--cb)' }}>
                <h3 className="serif" style={{ fontSize: '20px', marginBottom: '14px' }}>What happens after you submit</h3>
                <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '14px' }}>
                  {RUSH_STEPS.map((st, i) => (
                    <li key={st.title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span style={{ fontSize: '14px', color: 'var(--tm)', lineHeight: 1.55 }}><strong style={{ color: '#1a1a1a' }}>{st.title}.</strong> {st.text}</span>
                    </li>
                  ))}
                </ol>
                <p style={{ margin: '16px 0 0', paddingTop: '14px', borderTop: '1px solid var(--cb)', fontSize: '13px', color: 'var(--td)', lineHeight: 1.6 }}>
                  Please don&apos;t email tax documents. We&apos;ll send you a secure portal link.
                </p>
              </div>

              {/* Trust items (same values as the hero strip, from the data file) */}
              <ul style={{ listStyle: 'none', margin: '24px 0 0', padding: '20px 24px', borderRadius: '16px', background: '#fff', border: '1px solid var(--cb)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px 18px' }}>
                {LANDING.trust.map((t) => (
                  <li key={t} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '14px', color: 'var(--tm)', lineHeight: 1.4 }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M4 10l4 4 8-8" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {t}
                  </li>
                ))}
              </ul>

              <aside style={{ marginTop: '24px', padding: '24px 28px', borderRadius: '16px', background: 'rgba(212,0,31,.05)', border: '1px solid rgba(212,0,31,.16)' }}>
                <h3 className="serif" style={{ fontSize: '20px', marginBottom: '8px' }}>Prefer to talk?</h3>
                <p style={{ fontSize: '15px', color: 'var(--tm)', lineHeight: 1.6, margin: '0 0 10px' }}>
                  Call <a href={PHONE_TEL} style={{ color: 'var(--accent)', fontWeight: 700 }}>{PHONE_DISPLAY}</a>, {PHONE_HOURS}.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--td)', lineHeight: 1.6, margin: 0 }}>{ADDRESS}</p>
              </aside>
            </div>

            {/* Right: request form (#request) */}
            <div id="request" ref={requestRef} style={anchorMargin}>
              <div style={{ marginBottom: '28px' }}>
                <div className="slabel">Request Rush Service</div>
                <h2 className="stitle" style={{ textAlign: 'left' }}>{FORM_MESSAGES.heading}</h2>
                <p className="ssub" style={{ textAlign: 'left', margin: '12px 0 0' }}>{FORM_MESSAGES.sub}</p>
              </div>
              <div style={{ padding: 'clamp(22px,3vw,34px)', borderRadius: '20px', background: 'var(--card)', border: '1px solid var(--cb)', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04)', position: 'relative' }}>
                <RushRequestForm prefill={prefill} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="section bg-surface" id="faq" style={anchorMargin}>
        <div className="container">
          {head('FAQ', 'Rush Service questions')}
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {LANDING_FAQS.map(({ q, a }, i) => (
              <FaqItem key={q} question={q} answer={a} onOpen={() => trackRush('rush_faq_open', { question_number: i + 1 })} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. Closing band + disclaimer */}
      <section className="cta-bar cta-light" id="closing">
        <div className="hero-light-glow" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ maxWidth: '700px', margin: '0 auto 24px' }}>{LANDING.closingHeading}</h2>
          <div className="cta-buttons">
            <a href="#request" className="btn-pl" onClick={() => setPrefill({ source: 'closing band', nonce: Date.now() })}>Request Rush Service {arrow}</a>
          </div>
          <p style={{ maxWidth: '760px', margin: '32px auto 0', fontSize: '12px', color: 'var(--tf)', lineHeight: 1.7, fontStyle: 'italic', textAlign: 'center' }}>{RUSH_DISCLAIMER}</p>
        </div>
      </section>

      {/* Sticky mobile button */}
      <div className={`rush-sticky${heroPassed && !formInView ? ' show' : ''}`} aria-hidden={!(heroPassed && !formInView)}>
        <a href="#request" className="btn-pl" tabIndex={heroPassed && !formInView ? 0 : -1} onClick={() => setPrefill({ source: 'sticky button', nonce: Date.now() })} style={{ padding: '14px 18px', fontSize: '16px' }}>
          Request Rush Service
        </a>
      </div>
    </>
  );
}
