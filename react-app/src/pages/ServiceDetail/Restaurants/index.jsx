import { useEffect, useRef, useState } from 'react';
import { Zap, Check, Receipt, RefreshCw, Target, UserCheck, BarChart3, BookOpen, Calculator, Banknote, ClipboardList, Star, Landmark, CalendarDays } from 'lucide-react';
import SEOHead from '../../../components/SEO/SEOHead';
import { SITE_URL, serviceSchema, breadcrumbSchema } from '../../../components/SEO/seoConfig';
import './restaurants.css';

// Restaurant back-office service page, ported 1:1 from the standalone landing page (restaurant-landing.html).
// All class names are prefixed rl- and styled in restaurants.css so nothing leaks into the rest of the site.
// The site's own header and footer wrap this page (the landing page's standalone top bar and footer are dropped).

const PATH = '/services/restaurants';
const BOOK = '/book'; // on-site booking page (embeds the calendar)

const TASKS = [
  ['auto', Zap, 'Yesterday\'s POS sales synced', 'Card, cash, comps & voids categorized', '11:58 PM', '.2s'],
  ['auto', Zap, 'Delivery payouts split out', 'DoorDash · Uber Eats · Grubhub, fees & tax separated', '12:04 AM', '.6s'],
  ['auto', Zap, 'Bank deposits matched', '2 items flagged for review', '12:06 AM', '1s'],
  ['human', Check, 'Flagged items reviewed', 'Checked by your BAAS accountant', '9:15 AM', '1.4s'],
  ['auto', Zap, 'Health permit renewal reminder', 'Due in 30 days, paperwork started', '9:30 AM', '1.8s'],
  ['auto', Zap, '14 review requests sent', 'To last night\'s dine-in guests', '10:00 AM', '2.2s'],
];

const PAINS = [
  ['1:00 AM', '"Does the POS match the bank?"', 'Card batches, cash drops, delivery-app payouts and processor fees never quite line up. You know money is leaking, but you can\'t see where.'],
  ['Quarter end', '"What do I owe CDTFA?"', 'Sales tax gets filed from a rough number. Delivery-app sales get taxed twice, or not at all. Late returns can add a 10% penalty plus interest.'],
  ['Every payday', '"Did we report tips right?"', 'Tip pools, cash tips, credit-card tips, and minimum-wage rules that change by city. One mistake can bring an EDD or IRS letter.'],
];

const STEPS = [
  ['auto', Receipt, 'Your POS closes out', 'Sales, tips, comps and voids are captured automatically every night.'],
  ['auto', RefreshCw, 'Everything syncs', 'Bank, card processor, delivery apps and vendor bills flow into QuickBooks.'],
  ['auto', Target, 'Smart matching', 'AI-assisted rules categorize and reconcile, then flag anything unusual.'],
  ['human', UserCheck, 'Accountant review', 'A real person checks flagged items, tax returns and every payroll run.'],
  ['auto', BarChart3, 'You get answers', 'Prime cost, food cost % and cash position, delivered to your phone.'],
];

const SERVICES = [
  [BookOpen, 'Bookkeeping & reporting', 'Monthly books built for restaurants, not generic businesses.', 'Daily POS sync, bank feeds, expense categorization', 'Month-end close, prime-cost & food-cost review'],
  [Calculator, 'Sales tax (CDTFA)', 'Seller\'s permit, returns and payments filed on time, every time.', 'Taxable sales pulled from POS, delivery-app sales separated', 'Every return reviewed before filing, notices handled'],
  [Banknote, 'Payroll with tips', 'Tipped payroll done right, including tip reporting and the FICA tip credit.', 'Hours & tips imported, payroll taxes filed, pay stubs sent', 'Minimum-wage & overtime checks, Form 8846 tip credit'],
  [ClipboardList, 'Licensing & permits', 'Never miss a renewal on a license, permit or filing again.', 'Renewal calendar with 90/60/30-day reminders', 'Business license, seller\'s permit & DBA filings; ABC and health permits coordinated'],
  [Star, 'Customer management', 'Turn first-time guests into regulars without lifting a finger.', 'Review requests, missed-call text-back, birthday & win-back offers', 'Campaign setup, message writing, monthly results review'],
  [Landmark, 'Business & owner taxes', 'Year-end returns that start from clean, current books.', 'Year-round document collection & organizer reminders', 'Tax planning, Section 179 on kitchen equipment, filing'],
];

const COMPARE = [
  ['Daily sales', 'Printing Z-reports and typing totals into a spreadsheet', 'Synced from your POS every night, automatically'],
  ['Delivery apps', 'One lump-sum deposit with no idea what the fees were', 'Every payout broken into sales, fees, refunds and tax'],
  ['Sales tax', 'Scrambling at deadline, guessing at taxable sales', 'Return prepared from real data, reviewed and filed on time'],
  ['Tips & payroll', 'Paper tip logs and late-night math', 'Tips flow from POS to payroll, taxes filed for you'],
  ['Permits', 'Finding out a renewal was due when the inspector arrives', 'Reminders 90, 60 and 30 days out, with paperwork started'],
  ['Reviews & regulars', 'Hoping happy guests remember to leave a review', 'Automatic review requests and win-back texts to lapsed guests'],
  ['Knowing your numbers', 'Finding out in April whether last year was profitable', 'Prime cost and cash position on your phone every week'],
];

const QUESTIONS = [
  { q: 'My POS sales and bank deposits don\'t match from month to month.', fix: 'Nightly POS-to-bank auto-reconciliation' },
  { q: 'Delivery-app payouts (DoorDash, Uber Eats, Grubhub) land as one lump sum I can\'t break down.', fix: 'Automatic payout splitting into sales, fees, refunds and tax' },
  { q: 'Our sales tax return is based on an estimate, not actual POS reports.', fix: 'Sales tax figures pulled straight from POS data' },
  { q: 'We\'ve received a letter from CDTFA, the IRS or EDD in the past year.', fix: 'Notice handling plus an automated filing calendar' },
  { q: 'Tips are tracked on paper or in a spreadsheet.', fix: 'Tips imported from POS directly into payroll' },
  { q: 'I don\'t know last month\'s food cost % or prime cost.', fix: 'Weekly prime-cost report delivered to your phone' },
  { q: 'We\'ve missed (or nearly missed) a permit or license renewal.', fix: '90/60/30-day renewal reminders with paperwork started' },
  { q: 'Our books are more than two months behind.', fix: 'One-time Rescue, then daily auto-sync so it never happens again' },
  { q: 'We don\'t have a system for asking guests to leave reviews.', fix: 'Automated review requests after every visit' },
  { q: 'I spend 5+ hours a week on paperwork instead of running the restaurant.', fix: 'Full Back-Office automation, so your evenings come back' },
];

const PLANS = [
  { name: 'Essentials', forWho: 'For single-location cafés & food trucks', price: '$600',
    items: [[1, 'Daily POS & bank sync'], [1, 'Delivery-app payout splitting'], [0, 'Monthly bookkeeping & P&L'], [0, 'CDTFA sales tax returns'], [1, 'License & permit renewal calendar']] },
  { name: 'Full Back-Office', forWho: 'For full-service restaurants with staff', price: '$1,000', featured: true,
    items: [[0, 'Everything in Essentials'], [1, 'Tipped payroll with tip import'], [0, 'Payroll tax filings & FICA tip credit'], [1, 'Weekly prime-cost & food-cost report'], [0, 'Quarterly review call with your accountant']] },
  { name: 'Growth', forWho: 'For restaurants ready to fill more tables', price: '$1,500',
    items: [[0, 'Everything in Full Back-Office'], [1, 'Automated Google review requests'], [1, 'Missed-call text-back'], [1, 'Birthday, loyalty & win-back SMS'], [0, 'Monthly customer & marketing report']] },
];

const TOOLS = ['Toast', 'Square', 'Clover', 'QuickBooks', 'DoorDash', 'Uber Eats', 'Grubhub', 'Google Business Profile'];

const FAQS = [
  ['Does automation mean no human looks at my books?', 'No. Automation handles the repetitive work: pulling sales from your POS, matching deposits, categorizing expenses and sending reminders. A real accountant reviews every flagged item, every sales tax return and every payroll run before anything is filed or paid.'],
  ['Which POS systems do you work with?', 'We work with the major restaurant POS systems, including Toast, Square and Clover. We can also set up a workflow for most others that export daily sales reports.'],
  ['How do you handle DoorDash, Uber Eats and Grubhub sales for sales tax?', 'In California, delivery marketplaces generally collect and remit sales tax on orders placed through their platforms. We separate those sales from your in-house sales so you report them correctly and don\'t pay tax twice.'],
  ['My books are months behind. Can you still help?', 'Yes. We start with a one-time Restaurant Books & Sales Tax Rescue to catch you up, then switch on the automations so you never fall behind again.'],
  ['Do you handle liquor licenses and health permits?', 'We track every permit and license renewal date. We prepare the paperwork for business licenses, seller\'s permits and fictitious business names. For ABC liquor licenses and county health permits, we coordinate with specialists and the agencies on your behalf.'],
  ['How long does setup take?', 'Most restaurants are fully connected within two to three weeks, depending on how current the books are and how many locations you run.'],
];

const SCHEMA = [
  {
    ...serviceSchema({
      name: 'Restaurant Accounting, Sales Tax & Payroll',
      description: 'Automated restaurant bookkeeping, sales tax, tipped payroll, licensing support and customer management for restaurants. AI-assisted, human-verified.',
      path: PATH,
    }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Restaurant Back-Office Plans',
      itemListElement: [
        { '@type': 'Offer', name: 'Essentials', price: '600', priceCurrency: 'USD', description: 'Automated bookkeeping, sales tax filing and compliance calendar' },
        { '@type': 'Offer', name: 'Full Back-Office', price: '1000', priceCurrency: 'USD', description: 'Essentials plus tipped payroll and monthly prime-cost reporting' },
        { '@type': 'Offer', name: 'Growth', price: '1500', priceCurrency: 'USD', description: 'Full Back-Office plus automated reviews, SMS win-back and loyalty campaigns' },
      ],
    },
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Restaurants', path: PATH },
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];

// Quiz result copy by score band: [bold lead, rest, verdict class, meter color, CTA label]
function verdictFor(n) {
  if (n === 0) return [null, 'Check the boxes that apply to see your result.', 'rl-v-good', 'var(--green)', 'Get my free back-office review'];
  if (n <= 2) return ['Mostly healthy.', ' A few gaps, but nothing urgent. Automating these now keeps small issues from turning into penalties.', 'rl-v-good', 'var(--green)', 'Get my free back-office review'];
  if (n <= 5) return ['Money is probably leaking.', ' Restaurants with this profile often have unreconciled deposits, missed tax savings, or sales tax that doesn\'t match real sales. Fix it before your next quarterly filing.', 'rl-v-warn', 'var(--amber)', 'Fix these before next quarter →'];
  return ['High risk. Act now.', ' Your back office is exposed to sales tax penalties, payroll errors and notices from tax agencies. Start with a Books & Sales Tax Rescue, then let automation keep you clean.', 'rl-v-bad', 'var(--red)', 'Request my Rescue review →'];
}

export default function Restaurants() {
  const pageRef = useRef(null);
  const [checked, setChecked] = useState(() => QUESTIONS.map(() => false));

  // Scroll reveal. The hidden state only applies once rl-js is set, so the content stays visible without JS.
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const els = root.querySelectorAll('.rl-reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('rl-in')); return undefined; }
    root.classList.add('rl-js');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('rl-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggle = (i) => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)));
  const n = checked.filter(Boolean).length;
  const [lead, rest, vClass, meterColor, ctaText] = verdictFor(n);

  return (
    <>
      <SEOHead
        title="Restaurant Accounting, Sales Tax & Payroll on Autopilot | Bay Area Accounting Solutions"
        description="Automated restaurant bookkeeping, CDTFA sales tax, tipped payroll, permit tracking and customer follow-up for Bay Area restaurants. AI-assisted, human-verified. Serving since 2006."
        url={`${SITE_URL}${PATH}`}
        type="website"
        structuredData={SCHEMA}
      />

      <div className="rl-page" ref={pageRef}>
        {/* HERO */}
        <section className="rl-hero">
          <div className="rl-wrap rl-hero-grid">
            <div>
              <span className="rl-eyebrow">For restaurants, cafés, food trucks &amp; caterers</span>
              <h1>Your kitchen runs on systems.<br /><em>Your back office should too.</em></h1>
              <p className="rl-lede">We automate the paperwork that keeps you up after close: daily sales sync, sales tax, tipped payroll, permit renewals and customer follow-up. Then a real accountant checks every number before anything gets filed.</p>
              <div className="rl-hero-ctas">
                <a className="rl-btn rl-btn-primary" href="#checkup">Take the 60-second checkup →</a>
                <a className="rl-btn rl-btn-ghost" href="#how">See how it works</a>
              </div>
              <div className="rl-trust">
                <span>Serving the Bay Area since 2006</span>
                <span>QuickBooks-certified</span>
                <span>AI-assisted, human-verified</span>
              </div>
            </div>

            <div className="rl-autopanel" aria-label="Example of automated tasks running overnight">
              <div className="rl-autopanel-head">While you were closing up… <span className="rl-live">Automations running</span></div>
              {TASKS.map(([kind, Icon, title, sub, time, delay]) => (
                <div className="rl-task" style={{ animationDelay: delay }} key={title}>
                  <div className={`rl-ic rl-ic-${kind}`}><Icon size={16} strokeWidth={2.4} aria-hidden="true" /></div>
                  <div><b>{title}</b><small>{sub}</small></div>
                  <span className="rl-time">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PAIN */}
        <section className="rl-alt">
          <div className="rl-wrap">
            <div className="rl-center rl-reveal">
              <span className="rl-eyebrow">Sound familiar?</span>
              <h2>You opened a restaurant to feed people,<br />not to fight with spreadsheets.</h2>
              <p className="rl-lede">Margins are thin and the hours are long. Three government agencies want something from you every quarter. The paperwork waits until everyone has gone home, and it keeps piling up.</p>
            </div>
            <div className="rl-pain-grid">
              {PAINS.map(([tag, title, text]) => (
                <div className="rl-pain rl-reveal" key={title}><span className="rl-tag">{tag}</span><h3>{title}</h3><p>{text}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how">
          <div className="rl-wrap">
            <div className="rl-center rl-reveal">
              <span className="rl-eyebrow">How it works</span>
              <h2>Automation does the busywork.<br />People check every number.</h2>
              <p className="rl-lede">We connect your POS, bank, delivery apps and payroll into one automated pipeline. Software does the repetitive work every night, and your accountant reviews anything that looks off.</p>
            </div>
            <div className="rl-pipeline rl-reveal">
              {STEPS.map(([kind, Icon, title, text]) => (
                <div className={`rl-step${kind === 'human' ? ' rl-human' : ''}`} key={title}>
                  <div className="rl-node"><Icon size={28} strokeWidth={1.8} aria-hidden="true" /></div>
                  <div>
                    <span className={`rl-badge rl-badge-${kind}`}>{kind === 'human' ? 'Human-verified' : 'Automated'}</span>
                    <h4>{title}</h4>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="rl-alt" id="services">
          <div className="rl-wrap">
            <div className="rl-center rl-reveal">
              <span className="rl-eyebrow">One partner, the whole back office</span>
              <h2>Everything a restaurant needs, automated</h2>
              <p className="rl-lede">Accounting, sales tax, payroll, licensing and customer management, all from one team with one login. You don&apos;t need five vendors who never talk to each other.</p>
            </div>
            <div className="rl-svc-grid">
              {SERVICES.map(([Icon, title, desc, auto, human]) => (
                <div className="rl-svc rl-reveal" key={title}>
                  <div className="rl-icon"><Icon size={30} strokeWidth={1.8} aria-hidden="true" /></div>
                  <h3>{title}</h3>
                  <p className="rl-desc">{desc}</p>
                  <div className="rl-row rl-a"><b><Zap className="rl-inl" size={15} strokeWidth={2.4} aria-hidden="true" />Automated:</b><span>{auto}</span></div>
                  <div className="rl-row rl-h"><b><Check className="rl-inl" size={15} strokeWidth={2.6} aria-hidden="true" />Human:</b><span>{human}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BEFORE / AFTER */}
        <section>
          <div className="rl-wrap">
            <div className="rl-center rl-reveal">
              <span className="rl-eyebrow">Before &amp; after</span>
              <h2>What changes when your back office runs itself</h2>
            </div>
            <div className="rl-compare rl-reveal">
              <table>
                <thead><tr><th>Task</th><th>Today</th><th>With BAAS automation</th></tr></thead>
                <tbody>
                  {COMPARE.map(([task, today, baas]) => (
                    <tr key={task}><td>{task}</td><td>{today}</td><td>{baas}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* QUIZ */}
        <section className="rl-alt" id="checkup">
          <div className="rl-wrap">
            <div className="rl-center rl-reveal">
              <span className="rl-eyebrow">Free 60-second checkup</span>
              <h2>Restaurant Back-Office Health Check</h2>
              <p className="rl-lede">Check every statement that&apos;s true for your restaurant. You&apos;ll see your score and exactly which automations would fix each problem.</p>
            </div>
            <div className="rl-quiz">
              <div className="rl-q-list">
                {QUESTIONS.map((item, i) => (
                  <label className="rl-q" key={item.q}>
                    <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} />
                    <span>{item.q}</span>
                  </label>
                ))}
              </div>
              <aside className="rl-result" aria-live="polite">
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Your back-office risk score</div>
                <div className="rl-meter"><i style={{ width: `${n * 10}%`, background: meterColor }} /></div>
                <div className="rl-score">{n}<small> / 10</small></div>
                <div className={`rl-verdict ${vClass}`}>{lead && <b>{lead}</b>}{rest}</div>
                {n > 0 && <div className="rl-fixes-title">Automations that would fix this:</div>}
                <ul className="rl-fixes">
                  {QUESTIONS.filter((_, i) => checked[i]).map((item) => <li key={item.fix}>{item.fix}</li>)}
                </ul>
                <a className="rl-btn rl-btn-primary" href="#book">{ctaText}</a>
              </aside>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="plans">
          <div className="rl-wrap">
            <div className="rl-center rl-reveal">
              <span className="rl-eyebrow">Simple monthly plans</span>
              <h2>Pick the plan that fits your restaurant</h2>
              <p className="rl-lede">Flat monthly pricing with no surprise invoices. Every plan includes automation setup and a dedicated accountant. <Zap className="rl-inl" size={15} strokeWidth={2.4} aria-hidden="true" /> marks automated features.</p>
            </div>
            <div className="rl-plans">
              {PLANS.map((p) => (
                <div className={`rl-plan rl-reveal${p.featured ? ' rl-feat' : ''}`} key={p.name}>
                  <h3>{p.name}</h3><div className="rl-for">{p.forWho}</div>
                  <div className="rl-price">{p.price}<small> /mo starting</small></div>
                  <ul>
                    {p.items.map(([auto, text]) => <li className={auto ? 'rl-auto' : undefined} key={text}>{text}</li>)}
                  </ul>
                  <a className={`rl-btn ${p.featured ? 'rl-btn-primary' : 'rl-btn-ghost'}`} href="#book">Get started</a>
                </div>
              ))}
            </div>
            <div className="rl-rescue rl-reveal">
              <div><h3>Behind on books or sales tax?</h3><p>Start with a one-time <b>Restaurant Books &amp; Sales Tax Rescue</b>. We catch you up and clean up past returns, then switch on the automations so you never fall behind again.</p></div>
              <a className="rl-btn rl-btn-primary" href="#book">Request a rescue quote</a>
            </div>
            <div className="rl-center" style={{ marginTop: '44px' }}>
              <p style={{ fontWeight: 700, color: 'var(--ink)' }}>Works with the tools you already use</p>
              <div className="rl-logos">{TOOLS.map((t) => <span className="rl-chip" key={t}>{t}</span>)}</div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rl-alt" id="faq">
          <div className="rl-wrap">
            <div className="rl-center rl-reveal"><span className="rl-eyebrow">Questions</span><h2>Restaurant owners usually ask…</h2></div>
            <div className="rl-faq">
              {FAQS.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          </div>
        </section>

        {/* FINAL CTA / BOOKING */}
        <section className="rl-final" id="book">
          <div className="rl-wrap rl-book-grid">
            <div>
              <span className="rl-eyebrow">Free 30-minute back-office review</span>
              <h2>Close up tonight and leave the paperwork to us.</h2>
              <p className="rl-lede">On a short call, we&apos;ll look at your POS, sales tax and payroll setup. Then we&apos;ll show you exactly what we&apos;d automate.</p>
              <ul>
                <li>Find where money is leaking between POS and bank</li>
                <li>Check your sales tax and tip reporting for red flags</li>
                <li>Get a clear automation plan and flat monthly price</li>
              </ul>
              <p className="rl-contact">Prefer to talk now? <a href="tel:+15109627300">(510) 962-7300</a> · <a href="mailto:info@bayareaaccountingsolutions.com">info@bayareaaccountingsolutions.com</a></p>
            </div>
            <div className="rl-booking" id="booking-widget">
              <CalendarDays size={40} strokeWidth={1.6} style={{ color: 'var(--red)' }} aria-hidden="true" />
              <h3>Book your free review</h3>
              <p>Pick a time that works around your service hours, early mornings and between lunch and dinner included.</p>
              <a className="rl-btn rl-btn-primary" href={BOOK}>Book a free review</a>
              <a className="rl-btn rl-btn-ghost" href="tel:+15109627300">Call (510) 962-7300</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
