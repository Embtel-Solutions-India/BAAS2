import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../../components/SEO/SEOHead';
import { SITE_URL, serviceSchema, breadcrumbSchema } from '../../../components/SEO/seoConfig';
import { api } from '../../../utils/api';
import { BOOK_PATH } from '../../../data/booking';
import { PHONE_DISPLAY, PHONE_TEL, EMAIL } from '../../../data/rush';

// Landing page for contractors and trades (converted from the standalone contractor-landing-page.html).
// Uses the site's own header and footer; styles live in globals.css under the .ct-page scope.

const SMS_MAIN = 'Text me about this request. I agree to receive text messages from Bay Area Accounting Solutions at the number above, including appointment reminders, document requests and replies to my inquiry. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of service.';
const SMS_SAVED = `${SMS_MAIN} See our Privacy Policy.`; // exact wording the visitor saw; it is saved with the request

const NEEDS = [
  ['Not sure yet', 'Not sure yet'],
  ['Monthly bookkeeping', 'Monthly bookkeeping and job costing'],
  ['Bookkeeping cleanup', 'Catching up on past bookkeeping'],
  ['Payroll and 1099s', 'Payroll and 1099s'],
  ['Tax preparation', 'Business or personal tax return'],
  ['Business formation', 'Forming an LLC or corporation'],
  ['Registered agent', 'Registered agent service'],
];

const FACTS = [
  ['Free consultation', '30 minutes, no obligation'],
  ['Bookkeeping from $250/mo', 'Up to 100 transactions a month'],
  ['Fremont, CA office', '39159 Paseo Padre Parkway, Suite 115'],
  ['Client references', 'Available on request'],
];

const POINTS = [
  'Income and costs tracked by job, so you can see what each project made',
  'W-9s collected from your subs and 1099-NECs filed for you',
  'Starting prices published on this page',
];

const PROBLEMS = [
  ['Cash goes out before it comes in', 'You pay for materials and crews up front, then wait 30, 60 or 90 days to get paid, with retention held back on top. One slow-paying GC can squeeze the whole month.'],
  ['You don’t know which jobs made money', 'Without job costing, you find out a project lost money months after it closed, and the next bid repeats the same mistake.'],
  ['1099 season turns into a chase', 'Subs get paid all year, but W-9s weren’t collected up front. For forms due in 2026, the IRS charges $60 to $340 per late or incorrect 1099, plus a separate penalty for the copy each sub should receive.'],
  ['Payroll spreads across jobs and trades', 'Crews move between jobs, and workers’ comp is rated by job class. Hours coded to the wrong class can mean an unexpected bill at your insurance audit.'],
  ['Business and personal money are mixed', 'Materials, fuel, truck payments and groceries all run through one account. Untangling it at tax time takes hours and makes it easy to miss deductions.'],
  ['Taxes are a surprise every April', 'No quarterly estimates and no plan for the year means a bigger bill than expected, sometimes with penalties added on.'],
];

const SERVICES = [
  ['Monthly bookkeeping with job costing', 'Bank and card accounts reconciled each month, expenses categorized, and income and costs tracked by job so you can see each project’s margin. Monthly reports in plain language.'],
  ['Bookkeeping cleanup', 'Months or years behind? We catch your books up and reconcile them so you’re current and ready for tax filing.'],
  ['Payroll', 'Regular payroll for your crew, with hours allocated to each job and payroll records kept in order.'],
  ['W-9s and 1099s', 'We collect W-9s from subs as you bring them on, track what you pay each one, and prepare and file your 1099-NECs.'],
  ['Business and personal tax returns', 'Returns prepared with the deductions contractors commonly have, such as vehicles, tools and equipment, plus help planning quarterly estimated payments.'],
  ['Business formation and registered agent', 'Setting up an LLC or corporation as your business grows, and registered agent service to receive official notices for your entity.'],
];

// [service, note, price, price note] ; a null price means "quoted"
const PRICES = [
  ['Bookkeeping & accounting', 'Monthly, up to 100 transactions', '$250', 'per month'],
  ['Bookkeeping cleanup', 'Catch-up work on past months or years', null, null],
  ['Payroll management', 'Base fee plus $15 for each employee', '$150', '+ $15 per employee'],
  ['Business tax preparation', 'Per return', '$650', ''],
  ['Personal tax preparation', 'Per return', '$550', ''],
  ['Business formation', 'LLC or corporation setup', '$2,500', ''],
  ['Registered agent service', 'Annual service', '$199', 'per year'],
];

const STEPS = [
  ['Free consultation', 'Thirty minutes on your business, your current books and what you need, followed by a quote for your scope. No obligation.'],
  ['Setup', 'We connect to your bank and accounting software, set up tracking by job, and catch up any backlog first if you’re behind.'],
  ['Ongoing support', 'Books closed every month, payroll on schedule, and 1099s and returns prepared at deadline time, with one point of contact for questions.'],
];

const FAQS = [
  ['How do you price bookkeeping?', 'By monthly transaction volume. It starts at $250 a month for up to 100 transactions. We confirm your price after the free consultation, once we know your volume and how many jobs you run.'],
  ['What if my books are months behind?', 'That’s common. We start with a free review, quote the cleanup separately, and get you current before monthly bookkeeping begins.'],
  ['What should I have ready for the consultation?', 'Nothing is required. If it’s handy, know roughly how many jobs you run at once, how many people you pay, and which accounting software you use, if any.'],
  ['Is the information on this page tax advice?', 'No. It’s general information. What applies to you depends on your entity, your numbers and your situation, and we go through that with you directly.'],
];

const DESCRIPTION = 'Bookkeeping with job costing, payroll, 1099 filing and tax preparation for Bay Area contractors. Starting prices published. Free 30-minute consultation. Fremont, CA.';
const SCHEMA = [
  serviceSchema({ name: 'Bookkeeping, Payroll & Tax Prep for Contractors', description: DESCRIPTION, path: '/services/contractors' }),
  breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: 'Contractors', path: '/services/contractors' }]),
];

const usDigits = (v) => { const d = v.replace(/\D/g, ''); return d.length === 11 && d[0] === '1' ? d.slice(1) : d; };
const RULES = {
  name: (v) => v.trim().length > 1,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  phone: (v) => usDigits(v).length === 10,
};
const TRACKING_LABELS = { utm_source: 'UTM source', utm_medium: 'UTM medium', utm_campaign: 'UTM campaign', utm_term: 'UTM term', utm_content: 'UTM content', gclid: 'Google click ID', fbclid: 'Facebook click ID' };

function QuoteForm() {
  const [v, setV] = useState({ name: '', business: '', email: '', phone: '', need: 'Not sure yet' });
  const [sms, setSms] = useState(false);
  const [bad, setBad] = useState({});
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const doneRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => { if (done) doneRef.current?.focus(); }, [done]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setV((s) => ({ ...s, [k]: val }));
    if (bad[k]) setBad((b) => ({ ...b, [k]: !RULES[k](val) }));
  };
  const blur = (k) => () => { if (RULES[k] && v[k]) setBad((b) => ({ ...b, [k]: !RULES[k](v[k]) })); };

  const submit = async (e) => {
    e.preventDefault();
    setStatus('');
    const invalid = Object.keys(RULES).filter((k) => !RULES[k](v[k]));
    setBad(Object.fromEntries(Object.keys(RULES).map((k) => [k, invalid.includes(k)])));
    if (invalid.length) { ({ name: nameRef, email: emailRef, phone: phoneRef })[invalid[0]].current?.focus(); return; }

    const tracking = {};
    try {
      const qs = new URLSearchParams(window.location.search);
      Object.entries(TRACKING_LABELS).forEach(([k, label]) => { if (qs.get(k)) tracking[label] = qs.get(k).slice(0, 200); });
    } catch { /* ignore */ }

    setSending(true);
    try {
      await api.post('/quote-requests', {
        source: 'Contractors page',
        name: v.name.trim(),
        email: v.email.trim(),
        phone: usDigits(v.phone),
        sms_consent: sms,
        sms_consent_text: sms ? SMS_SAVED : '',
        website: hp,
        fields: {
          'Business name': v.business.trim() || '-',
          'Needs help with': v.need,
          'Page': window.location.href.split('?')[0],
          'Submitted at': new Date().toISOString(),
          ...tracking,
        },
      });
      try { if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form: 'Contractors page' }); } catch { /* ignore */ }
      setDone(v.name.trim().split(/\s+/)[0]);
    } catch {
      setStatus(`Your request didn’t go through. Try again, or call ${PHONE_DISPLAY} or email ${EMAIL}.`);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="ct-done" ref={doneRef} tabIndex={-1} role="status">
        <h3>Request received, {done}.</h3>
        <p>We’ll call or email you to set up your free consultation. Want to pick a time now?</p>
        <Link className="ct-btn ct-btn-red" to={BOOK_PATH}>Book a time</Link>
      </div>
    );
  }

  const err = (k, text) => (bad[k] ? <div className="ct-err" role="alert">{text}</div> : null);
  return (
    <form className="ct-ticket-body" onSubmit={submit} noValidate>
      {/* Honeypot for bots: hidden from people, ignored by the server if filled */}
      <input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />
      <div className="ct-row2">
        <div className={`ct-field${bad.name ? ' ct-bad' : ''}`}>
          <label htmlFor="ct-f-name">Full name</label>
          <input id="ct-f-name" ref={nameRef} type="text" autoComplete="name" value={v.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={bad.name ? 'true' : 'false'} required />
          {err('name', 'Enter your name.')}
        </div>
        <div className="ct-field">
          <label htmlFor="ct-f-biz">Business name <span className="ct-opt">(optional)</span></label>
          <input id="ct-f-biz" type="text" autoComplete="organization" value={v.business} onChange={set('business')} />
        </div>
      </div>
      <div className="ct-row2">
        <div className={`ct-field${bad.email ? ' ct-bad' : ''}`}>
          <label htmlFor="ct-f-email">Email</label>
          <input id="ct-f-email" ref={emailRef} type="email" autoComplete="email" inputMode="email" value={v.email} onChange={set('email')} onBlur={blur('email')} aria-invalid={bad.email ? 'true' : 'false'} required />
          {err('email', 'Enter an email like name@company.com.')}
        </div>
        <div className={`ct-field${bad.phone ? ' ct-bad' : ''}`}>
          <label htmlFor="ct-f-phone">Phone</label>
          <input id="ct-f-phone" ref={phoneRef} type="tel" autoComplete="tel" inputMode="tel" value={v.phone} onChange={set('phone')} onBlur={blur('phone')} aria-invalid={bad.phone ? 'true' : 'false'} required />
          {err('phone', 'Enter a 10-digit phone number.')}
        </div>
      </div>
      <div className="ct-field">
        <label htmlFor="ct-f-need">What do you need help with?</label>
        <select id="ct-f-need" value={v.need} onChange={set('need')}>
          {NEEDS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>

      <div className="ct-consent">
        <input type="checkbox" id="ct-f-sms" checked={sms} onChange={(e) => setSms(e.target.checked)} />
        <label htmlFor="ct-f-sms">{SMS_MAIN} See our <Link to="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</Link> and <Link to="/terms-and-conditions#sms-terms" target="_blank" rel="noopener">SMS Terms</Link>.</label>
      </div>

      <button type="submit" className="ct-btn ct-btn-red" disabled={sending}>{sending ? 'Sending…' : 'Request my free consultation'}</button>
      {status && <p className="ct-form-status" role="alert">{status}</p>}
      <p className="ct-fine">We use your details only to respond to this request and never sell them. <Link to="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</Link></p>
    </form>
  );
}

export default function Contractors() {
  return (
    <div className="ct-page">
      <SEOHead
        title="Contractor Bookkeeping & Payroll | Bay Area Accounting Solutions"
        description={DESCRIPTION}
        url={`${SITE_URL}/services/contractors`}
        type="website"
        structuredData={SCHEMA}
      />

      <section className="ct-hero">
        <div className="ct-wrap">
          <div className="ct-hero-grid">
            <div className="ct-hero-copy">
              <div className="ct-tag">For Bay Area contractors and trades</div>
              <h1>You build it.<br />We book it.</h1>
              <p>Bookkeeping, payroll, 1099s and tax preparation for contractors, so you can stay on the job site instead of catching up on QuickBooks at 10pm.</p>
              <ul className="ct-hero-points">
                {POINTS.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <p className="ct-hero-call">Rather talk it through? Call <a href={PHONE_TEL}>{PHONE_DISPLAY}</a></p>
            </div>

            <div className="ct-ticket" id="quote">
              <div className="ct-ticket-head">
                <h2>Quote request</h2>
                <span>Free 30-minute consultation</span>
              </div>
              <QuoteForm />
            </div>
          </div>

          <div className="ct-facts">
            {FACTS.map(([b, s]) => <div key={b}><b>{b}</b><span>{s}</span></div>)}
          </div>
        </div>
      </section>

      <section className="ct-sec">
        <div className="ct-wrap">
          <div className="ct-sec-head">
            <p className="ct-kicker">Sound familiar?</p>
            <h2>Where contractor finances usually break</h2>
            <p className="ct-lede">The work is the easy part. These are the money problems we see most often in construction and trade businesses.</p>
          </div>
          <div className="ct-problems">
            {PROBLEMS.map(([t, d]) => <article key={t}><h3>{t}</h3><p>{d}</p></article>)}
          </div>
        </div>
      </section>

      <section className="ct-sec ct-on-white" id="services">
        <div className="ct-wrap">
          <div className="ct-sec-head">
            <p className="ct-kicker">What we handle</p>
            <h2>Accounting set up around how contractors work</h2>
            <p className="ct-lede">Every service below is part of our standard scope. If you need something that isn’t listed, ask during your consultation and we’ll tell you straight whether we can take it on.</p>
          </div>
          <div className="ct-services">
            {SERVICES.map(([t, d]) => <div className="ct-svc" key={t}><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="ct-sec" id="pricing">
        <div className="ct-wrap">
          <div className="ct-sec-head">
            <p className="ct-kicker">Pricing</p>
            <h2>Starting prices, up front</h2>
            <p className="ct-lede">You’ll know the starting point before you call. Your final quote depends on your volume and the work involved.</p>
          </div>
          <div className="ct-sheet">
            <table>
              <caption>Bay Area Accounting Solutions price sheet</caption>
              <thead><tr><th scope="col">Service</th><th scope="col">Starting at</th></tr></thead>
              <tbody>
                {PRICES.map(([name, note, price, small]) => (
                  <tr key={name}>
                    <td><span className="ct-svc-name">{name}</span><span className="ct-svc-note">{note}</span></td>
                    <td>
                      {price
                        ? <span className="ct-price">{price}{small ? <small>{small}</small> : null}</span>
                        : <span className="ct-quoted">Quoted after a<br />free review</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ct-sheet-note">Prices shown are starting prices with no hidden fees. The final cost depends on your transaction volume, number of employees, filing requirements and the condition of your books.</p>
        </div>
      </section>

      <section className="ct-sec ct-on-white">
        <div className="ct-wrap">
          <div className="ct-sec-head">
            <p className="ct-kicker">How it works</p>
            <h2>From first call to books you can trust</h2>
          </div>
          <ol className="ct-steps">
            {STEPS.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="ct-sec">
        <div className="ct-wrap ct-split">
          <aside className="ct-refs">
            <h2>Talk to a client first</h2>
            <p>Prefer to hear from someone we already work with? Ask during your consultation and we’ll connect you with client references.</p>
            <a href="#quote" className="ct-btn ct-btn-red">Request a consultation</a>
          </aside>
          <div className="ct-faq">
            <h2 style={{ marginBottom: '22px' }}>Common questions</h2>
            {FAQS.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ct-close" id="contact">
        <div className="ct-wrap">
          <div>
            <h2>Get back to the job site.</h2>
            <p>Book your free 30-minute consultation online, or call and talk it through with us.</p>
          </div>
          <div className="ct-close-actions">
            <Link to={BOOK_PATH} className="ct-btn ct-btn-red">Book a free consultation</Link>
            <a href={PHONE_TEL} className="ct-btn ct-btn-white-line">Call {PHONE_DISPLAY}</a>
          </div>
        </div>
      </section>

      <section className="ct-disclaimer-wrap">
        <div className="ct-wrap">
          <p className="ct-disclaimer">Bay Area Accounting Solutions is a private bookkeeping, accounting and tax preparation firm. We are not a government agency and are not affiliated with the IRS, the California Franchise Tax Board, the EDD or the Contractors State License Board. Content on this page is general information, not legal or tax advice for your specific situation. Prices shown are starting prices; your final price depends on the scope of work. Penalty amounts cited are IRS figures for information returns due in 2026 and are adjusted annually.</p>
        </div>
      </section>
    </div>
  );
}
