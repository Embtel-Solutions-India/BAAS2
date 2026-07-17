import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, TrendingDown, FileX, CreditCard, Shield, BarChart2,
  Search, ClipboardCheck, RefreshCw, TrendingUp, Archive, FileText,
  CheckCircle, BarChart3, PieChart, Calendar, Zap, Clock, Bot,
  User, ChevronDown
} from 'lucide-react';
import RevealWrapper from '../../../components/UI/RevealWrapper';
import PageHero from '../../../components/Sections/PageHero';
import CtaBar from '../../../components/Sections/CtaBar';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

const fadeUp = { hidden:{opacity:0,y:36}, visible:{opacity:1,y:0,transition:{duration:.7,ease:[.16,1,.3,1]}} };
const stagger = { hidden:{}, visible:{transition:{staggerChildren:.08}} };

function SectionHeader({ label, title, sub, light }) {
  return (
    <div className="tc" style={{marginBottom:'60px'}}>
      {label && <div className="slabel" style={light ? {color:'#ff8fa0'} : {}}>{label}</div>}
      <h2 className="stitle" style={light ? {color:'#fff'} : {}} dangerouslySetInnerHTML={{__html:title}}/>
      {sub && <p className="ssub" style={light ? {color:'#f3c9cf'} : {}}>{sub}</p>}
    </div>
  );
}

/* ── Penalty Card used as hero visual ── */
function PenaltyCard() {
  return (
    <motion.div
      initial={{opacity:0,x:40,scale:.96}}
      animate={{opacity:1,x:0,scale:1}}
      transition={{duration:.85,delay:.25,ease:[.16,1,.3,1]}}
      className="page-hero-visual"
    >
      <div className="hero-card" style={{maxWidth:360}}>
        <div className="hero-card-line" aria-hidden="true"/>
        <div className="hero-card-label">What falling behind can cost you</div>
        <p style={{fontSize:'13px',color:'var(--td)',marginBottom:'14px'}}>IRS penalties stack month after month:</p>
        {[
          ['Failure-to-file penalty','5% / month'],
          ['Maximum cap','25% of tax owed'],
          ['Accuracy-related penalty','20% extra'],
          ['IRS lookback (unfiled returns)','Unlimited'],
        ].map(([label, val]) => (
          <div className="hero-card-row" key={label}>
            <span style={{fontSize:'13px'}}>{label}</span>
            <span style={{color:'var(--accent)',fontWeight:700,fontFamily:'var(--serif)',fontSize:'15px'}}>{val}</span>
          </div>
        ))}
        <p style={{fontSize:'12px',color:'var(--td)',marginTop:'14px',lineHeight:1.5}}>
          The fix is the same either way: clean, complete books.
        </p>
      </div>
    </motion.div>
  );
}

/* ── Interactive Quiz ── */
const QUIZ_ITEMS = [
  "I'm more than 2 months behind on bookkeeping",
  "My bank accounts haven't been reconciled recently (or ever)",
  "I have a pile of \"Uncategorized\" transactions in QuickBooks",
  "I sometimes pay business expenses from my personal account (or vice versa)",
  "My \"Undeposited Funds\" balance keeps growing and I don't know why",
  "I couldn't produce a profit & loss statement for a lender this week",
  "Last tax season, my CPA had to guess at numbers (or I filed an extension because of my books)",
  "I see negative balances or numbers that \"can't be right\" on my balance sheet",
  "I'm not 100% sure I claimed every deduction I was entitled to",
  "Thinking about my books gives me genuine anxiety",
];

function DiagnosticQuiz() {
  const [checked, setChecked] = useState(new Set());

  const toggle = (i) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const n = checked.size;
  let verdict = '', verdictColor = 'var(--ok, #0e7a3d)', advice = '', cta = 'Book My Free Diagnostic Review';

  if (n === 0) {
    verdict = 'Check the boxes above to see your result';
    advice = "Be honest — nobody's grading you, and we've seen far worse than whatever you're picturing.";
  } else if (n <= 2) {
    verdict = 'Mostly clean — with a couple of loose ends';
    advice = 'Small issues are cheapest to fix now, before tax season turns them into big ones. A quick diagnostic will confirm nothing bigger is hiding underneath.';
    cta = 'Book a Quick Diagnostic — Free';
  } else if (n <= 5) {
    verdict = 'Cleanup recommended — sooner is cheaper';
    verdictColor = 'var(--accent)';
    advice = "You're in the zone where messy books start costing real money: missed deductions, stalled loans, growing audit exposure. This is very fixable — typically in a week or two.";
  } else {
    verdict = 'Urgent — your books need attention now';
    verdictColor = 'var(--accent)';
    advice = "Penalties, lost deductions, and audit risk are actively compounding. We've fixed far worse, fast, and with zero judgment. Let's find out exactly where you stand — free.";
    cta = 'Book My Free Diagnostic — Today';
  }

  return (
    <div style={{border:'1px solid var(--cb)',borderRadius:'16px',overflow:'hidden',maxWidth:'760px'}}>
      <div style={{background:'var(--accent)',color:'#fff',padding:'18px 26px',fontWeight:700,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
        <span>How messy are your books, really?</span>
        <span style={{fontWeight:500,fontSize:'14px',opacity:.9}}>{n} of {QUIZ_ITEMS.length} checked</span>
      </div>
      <div style={{padding:'8px 26px'}}>
        {QUIZ_ITEMS.map((item, i) => (
          <label key={i} style={{display:'flex',gap:'14px',alignItems:'flex-start',padding:'15px 0',borderBottom:i < QUIZ_ITEMS.length - 1 ? '1px solid var(--cb)' : 'none',cursor:'pointer'}}>
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => toggle(i)}
              style={{width:'20px',height:'20px',accentColor:'var(--accent)',marginTop:'2px',flexShrink:0,cursor:'pointer'}}
            />
            <span style={{fontSize:'15px',color:'var(--text)',lineHeight:1.5}}>{item}</span>
          </label>
        ))}
      </div>
      <div style={{padding:'24px 26px',background:'rgba(212,0,31,.04)',borderTop:'1px solid var(--cb)'}}>
        <p style={{fontFamily:'var(--serif)',fontSize:'22px',marginBottom:'8px',color:verdictColor}}>{verdict}</p>
        <p style={{fontSize:'15px',color:'var(--tm)',marginBottom:'20px',lineHeight:1.6}}>{advice}</p>
        <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-pl" style={{padding:'13px 26px',fontSize:'15px'}}>
          {cta}
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
      </div>
    </div>
  );
}

/* ── FAQ Accordion ── */
function FaqAccordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      {items.map(([q, a], i) => (
        <div key={i} style={{border:'1px solid var(--cb)',borderRadius:'12px',overflow:'hidden'}}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{width:'100%',padding:'18px 22px',background:'none',border:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'14px',textAlign:'left',fontWeight:700,fontSize:'16px',color:'var(--text)',fontFamily:'var(--sans)'}}
          >
            <span>{q}</span>
            <ChevronDown size={20} color="var(--accent)" style={{flexShrink:0,transform:open===i?'rotate(180deg)':'none',transition:'transform .2s'}}/>
          </button>
          {open === i && (
            <div style={{padding:'0 22px 20px',fontSize:'15px',color:'var(--tm)',lineHeight:1.7}}>
              {a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function BookkeepingCleanup() {
  useEffect(() => {
    document.title = 'Bookkeeping Cleanup & Catch-Up Services | Bay Area Accounting Solutions';
  }, []);

  const costCards = [
    [AlertTriangle, 'Audit bait', 'IRS red flags multiply', 'Mismatched 1099s, unreported income, and inconsistent filings are exactly what IRS computers screen for. And if you\'re audited with incomplete records, legitimate deductions get disallowed — you pay tax on money you already spent.'],
    [TrendingDown, '25%+', 'Penalties compound', 'Failure-to-file penalties run 5% of unpaid tax per month, up to 25% — before interest. Add a 20% accuracy-related penalty if messy records lead to understated income. Waiting is the most expensive option.'],
    [FileX, 'Lost $$$', 'Deductions vanish', 'Every uncategorized transaction is a potential deduction you\'ll never claim. Vehicle costs, equipment, subcontractors, home office — if it\'s not in the books, it\'s not on the return.'],
    [CreditCard, 'Denied', 'Loans & credit stall', 'Lenders, landlords, and investors ask for financial statements. "Give me a few weeks to sort my books" kills deals. Clean books mean you can say yes to opportunity the same day.'],
    [Shield, 'Exposed', 'Your LLC shield weakens', 'Mixing personal and business money — comingling — is one of the ways courts justify piercing the corporate veil, putting your personal assets on the line. Clean books keep the wall standing.'],
    [BarChart2, 'Blind', "You're flying without instruments", 'No idea if last month was profitable? Which jobs or clients make money? Whether you can afford to hire? That constant low-grade money stress has a cause — and a fix.'],
  ];

  const included = [
    [Search, 'Diagnostic Review', 'A full assessment of your books: what\'s broken, what\'s missing, what it will take to fix — with a flat quote before we start.'],
    [Archive, 'Catch-Up Bookkeeping', 'Months — or years — of unrecorded transactions entered, categorized, and coded correctly. We can rebuild books entirely from bank statements.'],
    [FileText, 'QuickBooks Cleanup', 'Miscategorized transactions re-coded, duplicates removed, and your QuickBooks Online or Xero file restored to a state your CPA will thank you for.'],
    [RefreshCw, 'Bank Reconciliation', 'Every bank and credit card account reconciled to the statement, every month — the single strongest proof your books are accurate.'],
    [BarChart3, 'Balance Sheet Repair', 'Undeposited funds cleared, negative balances fixed, loans stated correctly, owner draws untangled from payroll.'],
    [ClipboardCheck, 'AR / AP Aging Cleanup', 'Phantom receivables written off, stale payables cleared, so your aging reports reflect money that\'s actually in motion.'],
    [PieChart, 'Chart of Accounts Restructure', 'A bloated, confusing account list collapsed into a clean structure that makes your reports readable at a glance.'],
    [CheckCircle, 'Tax-Ready Financials', 'Clean profit & loss, balance sheet, and cash flow statements — ready for your tax return, your lender, or your own peace of mind.'],
    [Calendar, 'Keep-It-Clean Plan', 'A monthly bookkeeping plan so you never fall behind again — with taxes, payroll, and formation services under the same roof when you need them.'],
  ];

  const steps = [
    ['S1', 'Diagnose', 'Free diagnostic review of your books. We tell you exactly what\'s wrong, how long the fix takes, and a flat price. No surprises.', 'Free · 30 min'],
    ['S2', 'Clean Up', 'We fix what exists: re-categorize, reconcile, de-duplicate, and repair your balance sheet. AI does the heavy lifting; accountants verify every result.', 'Days, not months'],
    ['S3', 'Catch Up', 'We fill the gaps: every missing month entered and reconciled, from bank statements if needed, until your books are current to today.', 'Audit-ready'],
    ['S4', 'Keep Clean', 'Monthly bookkeeping keeps you current forever — and with taxes, payroll, and formation in-house, you\'ll never juggle providers again.', 'Never behind again'],
  ];

  const aiRows = [
    ['12 months of catch-up, typical firm', '2–4 months'],
    ['12 months of catch-up, BAAS', '1–3 weeks'],
    ['Transactions reviewed by AI', '100%'],
    ['Results verified by an accountant', '100%'],
    ['Judgment involved', '0%'],
  ];

  const faqItems = [
    ['How far behind can my books be?', 'There\'s no limit. We regularly rebuild 1–5 years of books from bank statements, credit card statements, and receipts — even when no bookkeeping was ever done. Keep in mind the IRS can generally look back 3 years, 6 years if income is substantially understated, and indefinitely if a return was never filed — so catching up fully is what actually closes your exposure.'],
    ['How long does a cleanup take?', 'Most cleanups finish in 1–3 weeks, depending on transaction volume and how many months are behind. Our AI-assisted process moves dramatically faster than manual bookkeeping, and every result is verified by a professional accountant before delivery.'],
    ['Will messy books trigger an IRS audit?', 'Messy books don\'t directly trigger audits — but they create the red flags that do: 1099s that don\'t match your return, unreported income, and inconsistent filings. The bigger danger is being audited with messy books: without documentation, the IRS can disallow deductions you legitimately earned and add an accuracy-related penalty of 20% of the underpayment. Clean books are your best audit defense.'],
    ['What do you need from me to get started?', 'Usually just read-only access to your QuickBooks or Xero file and your bank/credit card statements (PDFs are fine). If you\'ve got receipts in a shoebox, a drawer, or your email — that works too. We handle the sorting.'],
    ['What does it cost?', 'Every cleanup gets a flat quote after the free diagnostic review, based on transaction volume and months behind — so you know the full price before we start, and it never changes mid-project. No hourly meters running.'],
    ['Do I have to keep using you afterward?', 'No — the cleanup is yours either way, delivered clean and documented for whoever does your books next. That said, most clients stay for monthly bookkeeping so they never fall behind again, and many bring their taxes and payroll over once they see the difference clean books make.'],
    ["I'm embarrassed about how bad it is. Seriously.", "You'd be amazed how often we hear this — and how normal your situation is. We've rebuilt books from grocery bags of receipts and five years of silence. No judgment, no lectures. You focused on running your business; now we'll handle this part."],
  ];

  const addons = ['Monthly Bookkeeping', 'Business & Individual Taxes', 'Payroll Management', 'Business Formation', 'Registered Agent · 50 States', 'Foreign Subsidiary Setup'];

  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services',to:'/services'},{label:'Bookkeeping Cleanup & Catch-Up'}]}
        label="Bookkeeping Cleanup & Catch-Up"
        title={<>Messy books? Months behind?<br/><span style={{color:'var(--accent)'}}>We'll fix it — without the judgment.</span></>}
        description="Every month your books stay messy, you're overpaying taxes, missing deductions, and building audit risk you can't see. We clean up and catch up your books fast — AI-assisted for speed, accountant-verified for accuracy."
        visual={<PenaltyCard />}
        showCta={true}
      />

      {/* ── Cost of Messy Books (dark bg) ── */}
      <section className="section" style={{background:'var(--dark, #0b0b0f)'}}>
        <div className="container">
          <SectionHeader
            light
            label="The Real Cost of Waiting"
            title="Messy books don't just sit there.<br/><span style='color:#ff8fa0'>They quietly get more expensive every month.</span>"
            sub={"Most business owners think of bookkeeping as paperwork they'll \u201cget to eventually.\u201d But disorganized books are actively costing you money in six ways:"}
          />

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}}
            style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'22px'}}
          >
            {costCards.map(([Icon, stat, title, desc]) => (
              <motion.div variants={fadeUp} key={title}
                style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'12px',padding:'28px 24px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(212,0,31,.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#ff5c73',flexShrink:0}}>
                    <Icon size={21} strokeWidth={1.8}/>
                  </div>
                  <div style={{fontFamily:'var(--serif,serif)',fontSize:'1.4rem',color:'#ff5c73'}}>{stat}</div>
                </div>
                <h3 style={{fontSize:'17px',color:'#fff',marginBottom:'10px'}}>{title}</h3>
                <p style={{fontSize:'14px',color:'#e8bcc3',lineHeight:1.6}}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <div style={{marginTop:'44px',background:'rgba(255,255,255,.07)',borderLeft:'4px solid var(--accent)',borderRadius:'0 12px 12px 0',padding:'22px 28px',maxWidth:'720px'}}>
            <p style={{color:'#fff',fontSize:'16px',lineHeight:1.7}}>
              <strong style={{color:'#ff8fa0'}}>Here's the good news:</strong> you're not in trouble yet — and you're not alone. Falling behind is the most common bookkeeping problem in small business. Every mess we've ever seen was fixable. The only mistake is waiting another month.
            </p>
          </div>
        </div>
      </section>

      {/* ── Diagnostic Quiz ── */}
      <section className="section bg-surface">
        <div className="container">
          <SectionHeader
            label="60-Second Self-Check"
            title="The Messy Books Diagnostic"
            sub="Check every statement that's true for your business. Your score tells you how urgent a cleanup is — and it's the first thing we'll review together on your free diagnostic call."
          />
          <RevealWrapper>
            <DiagnosticQuiz />
          </RevealWrapper>
        </div>
      </section>

      {/* ── What's Included ── */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            label="Everything Included"
            title="A complete cleanup —<br/>not a quick patch"
            sub="Every engagement covers the full stack of cleanup work, so your books don't just look clean — they hold up to a tax return, a lender, or an auditor."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}} className="feat-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
            {included.map(([Icon, h, p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <div className="feat-icon"><Icon size={25} strokeWidth={1.8}/></div>
                <h4>{h}</h4>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="section bg-surface">
        <div className="container">
          <SectionHeader
            label="How It Works"
            title="From shoebox to spotless in four steps"
            sub="Cleanup is a sequence — each step builds on the last, and you'll know exactly where your books stand at every stage."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="steps-grid">
            {steps.map(([n, t, d, tag]) => (
              <motion.div variants={fadeUp} key={n} className="step-card">
                <div className="step-bg" aria-hidden="true">{n}</div>
                <div className="step-num" style={{background:'rgba(212,0,31,.12)'}}>{n}</div>
                <h3 className="serif" style={{fontSize:'19px',marginBottom:'10px',position:'relative'}}>{t}</h3>
                <p style={{fontSize:'15px',color:'var(--td)',lineHeight:1.6,position:'relative',marginBottom:'14px'}}>{d}</p>
                <span style={{position:'relative',display:'inline-block',fontSize:'12px',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--accent)',background:'rgba(212,0,31,.08)',padding:'4px 12px',borderRadius:'20px'}}>{tag}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── AI-Assisted ── */}
      <section className="section bg-white">
        <div className="container">
          <div className="compare-grid" style={{alignItems:'center',gap:'56px'}}>
            <RevealWrapper delay={0.1}>
              <div className="slabel">Why We're Faster</div>
              <h2 className="stitle" style={{marginBottom:'16px'}}>AI-assisted speed.<br/>Human-verified accuracy.</h2>
              <p style={{color:'var(--tm)',lineHeight:1.7,marginBottom:'14px',fontSize:'16px'}}>
                Traditional cleanup means an accountant manually reviewing thousands of transactions — which is why most firms quote months and charge accordingly.
              </p>
              <p style={{color:'var(--tm)',lineHeight:1.7,marginBottom:'14px',fontSize:'16px'}}>
                We run your books through professional-grade AI accounting tools that categorize transactions, match receipts, flag duplicates, and detect anomalies in a fraction of the time. Then — this is the part that matters — <strong style={{color:'var(--text)'}}>a real accountant reviews and verifies everything</strong> before it touches your financials.
              </p>
              <ul style={{listStyle:'none',padding:0,marginTop:'16px'}}>
                {[
                  'Automated transaction categorization, trained on your business',
                  'Receipt & invoice scanning — email, photo, or shoebox',
                  'Duplicate and anomaly detection across every account',
                  'Bank-feed reconciliation at machine speed',
                  '100% professional review before anything is final',
                ].map(item => (
                  <li key={item} style={{padding:'9px 0 9px 28px',position:'relative',fontSize:'15px',color:'var(--td)',lineHeight:1.5}}>
                    <span style={{position:'absolute',left:0,color:'var(--accent)',fontWeight:700,fontSize:'16px'}}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </RevealWrapper>

            <RevealWrapper delay={0.2}>
              <div style={{background:'var(--dark,#0b0b0f)',borderRadius:'16px',padding:'32px',color:'#fff'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                  <Bot size={22} color="#ff8fa0"/>
                  <span style={{fontWeight:700,fontSize:'14px',color:'#ff8fa0',letterSpacing:'.06em',textTransform:'uppercase'}}>Cleanup Timeline Comparison</span>
                </div>
                {aiRows.map(([label, val]) => (
                  <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',fontSize:'14px',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.1)'}}>
                    <span style={{color:'#e8bcc3'}}>{label}</span>
                    <span style={{color:'#ff8fa0',fontWeight:700,flexShrink:0,marginLeft:'16px'}}>{val}</span>
                  </div>
                ))}
                <p style={{fontSize:'12px',color:'#d9a7af',marginTop:'16px',lineHeight:1.5}}>
                  Typical timelines — actual duration depends on transaction volume and record availability. We confirm yours in the free diagnostic.
                </p>
              </div>
            </RevealWrapper>
          </div>
        </div>
      </section>

      {/* ── Why BAAS ── */}
      <section className="section" style={{background:'var(--accent)',textAlign:'center'}}>
        <div className="container">
          <RevealWrapper>
            <h2 className="stitle" style={{color:'#fff',maxWidth:'22em',margin:'0 auto 16px'}}>
              Cleanup is what we're known for.<br/>Everything else is why you'll stay.
            </h2>
            <p style={{color:'#ffd9de',maxWidth:'44em',margin:'0 auto 32px',fontSize:'17px',lineHeight:1.7}}>
              Most firms treat cleanup as a nuisance job. We built our practice around it — because clean books are the foundation of everything else your business needs. Once your books are spotless, your taxes, payroll, and compliance all live under one roof.
            </p>
            <a href={BOOK} target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'#fff',color:'var(--accent)',textDecoration:'none',fontWeight:700,padding:'15px 30px',borderRadius:'8px',fontSize:'16px',border:'2px solid #fff',transition:'background .18s'}}>
              Start With a Free Diagnostic
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <div style={{marginTop:'36px',display:'flex',justifyContent:'center',gap:'10px',flexWrap:'wrap'}}>
              {addons.map(a => (
                <span key={a} style={{border:'1px solid rgba(255,255,255,.45)',borderRadius:'30px',padding:'7px 18px',fontSize:'14px',color:'#fff'}}>{a}</span>
              ))}
            </div>
          </RevealWrapper>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section bg-surface">
        <div className="container">
          <SectionHeader
            label="Common Questions"
            title="Bookkeeping cleanup,<br/>in plain English"
          />
          <div style={{maxWidth:'800px',margin:'0 auto'}}>
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* ── Other Services / Sidebar ── */}
      <section className="section bg-white">
        <div className="container">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'24px',maxWidth:'900px',margin:'0 auto'}}>
            <RevealWrapper delay={0.1}>
              <div className="sidebar-card">
                <h4>Other Services</h4>
                {[
                  ['Monthly Bookkeeping', '/services/bookkeeping'],
                  ['Business & Individual Taxes', '/services/tax-services'],
                  ['Payroll Management', '/services/payroll'],
                  ['Accounting & CFO Services', '/services/accounting'],
                  ['Business Formation', '/services/consulting'],
                  ['Registered Agent', '/services/registered-agent'],
                ].map(([l, to]) => (
                  <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                ))}
              </div>
            </RevealWrapper>

            <RevealWrapper delay={0.2}>
              <div className="sidebar-cta">
                <h4>Free Diagnostic Call</h4>
                <p>30 minutes with our team. We tell you exactly what shape your books are in and what it'll take to fix them — at no charge.</p>
                <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{width:'100%',justifyContent:'center'}}>Book Free Call</a>
              </div>
              <div className="sidebar-card" style={{marginTop:'16px'}}>
                <h4>Quick Facts</h4>
                {[
                  ['Timeline', '1–3 weeks typical'],
                  ['Pricing', 'Flat quote, no surprises'],
                  ['Software', 'QuickBooks · Xero · Spreadsheets'],
                  ['Service area', 'All 50 states (remote)'],
                ].map(([k, v]) => (
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--cb)',fontSize:'14px'}}>
                    <span style={{color:'var(--tm)'}}>{k}</span>
                    <span style={{fontWeight:600,color:'var(--text)',textAlign:'right'}}>{v}</span>
                  </div>
                ))}
              </div>
            </RevealWrapper>
          </div>
        </div>
      </section>

      <CtaBar
        heading="The best day to fix your books was months ago. The second best is today."
        sub="Free 30-minute diagnostic call. Know exactly where you stand — no obligation."
      />
    </>
  );
}
