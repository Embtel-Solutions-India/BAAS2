import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Percent, Scale, CalendarX, Building2, Search, Files, EyeOff, Map, Clock, Users, HelpCircle, Wallet, FileText, CalendarDays, Handshake, Calculator, CreditCard, FileCheck, ShieldCheck, BarChart3, BookOpen, SlidersHorizontal, Phone, MapPin } from 'lucide-react';
import RevealWrapper from '../../../components/UI/RevealWrapper';
import PageHero from '../../../components/Sections/PageHero';
import CtaBar from '../../../components/Sections/CtaBar';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

const fadeUp = { hidden:{opacity:0,y:36}, visible:{opacity:1,y:0,transition:{duration:.7,ease:[.16,1,.3,1]}} };
const stagger = { hidden:{}, visible:{transition:{staggerChildren:.08}} };

function SectionHeader({ label, title, sub }) {
  return (
    <div className="tc" style={{marginBottom:'60px'}}>
      {label && <div className="slabel">{label}</div>}
      <h2 className="stitle" dangerouslySetInnerHTML={{__html:title}}/>
      {sub && <p className="ssub">{sub}</p>}
    </div>
  );
}

function PainGroup({ icon: Icon, title, items }) {
  return (
    <div style={{marginBottom:'60px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(212,0,31,.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)'}}>
          <Icon size={22}/>
        </div>
        <h3 className="serif" style={{fontSize:'27px'}}>{title}</h3>
      </div>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}} className="pain-grid">
        {items.map(([Icon2,t,d]) => (
          <motion.div variants={fadeUp} key={t} className="pain-card">
            <div style={{fontSize:'31px',marginBottom:'12px',color:'var(--accent)'}}><Icon2 size={31} strokeWidth={1.5}/></div>
            <h3 className="serif" style={{fontSize:'18px',marginBottom:'8px'}}>{t}</h3>
            <p style={{fontSize:'15px',color:'var(--td)',lineHeight:1.6}}>{d}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function PayrollQuoteForm() {
  const [form, setForm] = useState({ name:'', email:'', biz:'', phone:'', employees:'', frequency:'', notes:'' });
  const [status, setStatus] = useState('idle');

  const submit = (e) => {
    e.preventDefault();
    const { name, email, biz, employees, frequency } = form;
    if (!name || !email || !biz || !employees || !frequency) { setStatus('error'); setTimeout(() => setStatus('idle'), 2500); return; }
    setStatus('sending');
    setTimeout(() => { setStatus('sent'); setTimeout(() => setStatus('idle'), 4000); }, 1500);
  };

  if (status === 'sent') {
    return (
      <div style={{marginTop:'24px',padding:'40px 32px',borderRadius:'20px',background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.35)',textAlign:'center'}}>
        <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'rgba(74,222,128,.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',color:'#22c55e'}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h3 className="serif" style={{fontSize:'24px',marginBottom:'10px',color:'#1a1a1a'}}>Thank you — your payroll quote request is on its way.</h3>
        <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.6,maxWidth:'440px',margin:'0 auto 24px'}}>We&apos;ll review your team details and send a custom payroll proposal within 24 hours. No long-term contracts. No hidden fees.</p>
        <button type="button" onClick={() => setStatus('idle')} className="btn-ghost" style={{margin:'0 auto'}}>Request another quote</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{marginTop:'24px',padding:'32px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)',boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04)'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
        <div className="form-group"><label>Full Name *</label><input type="text" className="form-input" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))}/></div>
        <div className="form-group"><label>Business Name *</label><input type="text" className="form-input" placeholder="Your Company LLC" value={form.biz} onChange={e => setForm(f => ({...f,biz:e.target.value}))}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
        <div className="form-group"><label>Email Address *</label><input type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))}/></div>
        <div className="form-group"><label>Phone Number</label><input type="tel" className="form-input" placeholder="(510) 000-0000" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
        <div className="form-group">
          <label>Number of Employees *</label>
          <select className="form-input" value={form.employees} onChange={e => setForm(f => ({...f,employees:e.target.value}))}>
            <option value="">Select...</option>
            {['1–5 employees','6–15 employees','16–30 employees','31–50 employees','50+ employees'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Payroll Frequency *</label>
          <select className="form-input" value={form.frequency} onChange={e => setForm(f => ({...f,frequency:e.target.value}))}>
            <option value="">Select...</option>
            {['Weekly','Bi-weekly','Semi-monthly','Monthly'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group" style={{marginTop:'8px'}}>
        <label>Anything else we should know?</label>
        <textarea className="form-input" rows={3} placeholder="Current payroll provider, special pay rules, multiple locations, etc." value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))}/>
      </div>
      <button type="submit" className="form-submit" style={{marginTop:'8px'}}>
        {status==='error'?'Please fill all required fields':status==='sending'?'Sending...':'Get My Payroll Quote'}
      </button>
    </form>
  );
}

export default function Payroll() {
  useEffect(() => { document.title = 'Payroll Management Services | BAAS'; }, []);

  const penalties = [
    [Percent,'Failure-to-deposit penalties','The IRS penalizes late payroll tax deposits on a sliding scale — 2% if 1–5 days late, 5% if 6–15 days, 10% beyond that, and 15% once a notice is issued. These add up shockingly fast because payroll taxes are due frequently, sometimes within days of each pay run.'],
    [Scale,'Trust Fund Recovery Penalty','Withheld employee taxes are considered "trust funds" held for the government. Fail to remit them and the IRS can pursue you personally — piercing the corporate veil. Owners and even bookkeepers can be held individually liable for 100% of the unpaid amount.'],
    [CalendarX,'Late return penalties stack separately','Filing Form 941 (quarterly) or 940 (annual) late carries its own penalties — separate from the deposit penalties. You can get hit twice for the same period: once for paying late, once for filing late.'],
    [Building2,'State agencies pile on too','California\'s EDD has its own deposit schedules, penalties, and interest — completely separate from the IRS. Miss a state deposit and you\'re penalized by two governments simultaneously, each with their own notices and collection process.'],
    [Search,'It snowballs into an audit','Repeated late payroll deposits flag your business for closer scrutiny. What began as one missed deadline can escalate into a full payroll tax audit, liens on business assets, and frozen accounts that halt operations.'],
  ];

  const forms = [
    [Files,'The Maze of Forms & Reports','Staying compliant means filing the right form, to the right agency, by the right deadline — federal AND state. Get any one wrong and the penalties follow.'],
    [EyeOff,'No reports = no visibility','Without proper payroll reports, you can\'t see your true labor cost, tax liability, or cash needs for the next pay run. You\'re operating one payroll away from a cash crunch you never saw coming.'],
    [Map,'Federal vs. state mismatches','Federal and California rules differ on overtime, sick leave, wage statements, and deposit timing. Compliance with one doesn\'t mean compliance with the other — and the differences are exactly where most businesses get caught.'],
    [Clock,'Deadlines you didn\'t know existed','New-hire reporting within 20 days. Quarterly returns. Annual reconciliations. Workers\' comp filings. Most owners discover these deadlines only after they\'ve missed them and the penalty notice arrives.'],
  ];

  const employee = [
    [HelpCircle,'"Why is my check different?"','When employees can\'t see clear breakdowns of their gross pay, taxes, and deductions, every paycheck question lands on your desk. Confusion breeds distrust — and distrust costs you good people.'],
    [Wallet,'Benefits & deductions in the dark','Health insurance, 401(k), HSA, garnishments — employees need to understand what\'s coming out and why. Without transparency, they feel shortchanged even when everything is correct.'],
    [FileText,'Pay stub & W-2 access','Employees need their documents for loans, apartments, and their own taxes. If they have to ask you every time, it\'s a burden on both sides — and a compliance risk if records aren\'t maintained.'],
    [CalendarDays,'PTO & sick leave tracking','California mandates paid sick leave with specific accrual and notice rules. Employees expect to see their balances. Manual tracking leads to errors, disputes, and potential labor violations.'],
    [Handshake,'Trust is your retention tool','Getting paid accurately and on time, with full transparency, is the baseline of employee trust. Mess up payroll and even your best people start updating their résumés. People forgive a lot — but not a wrong paycheck.'],
  ];

  const services = [
    [Calculator,'Payroll Processing','Accurate wages, overtime, bonuses, commissions, and deductions calculated every single pay period.'],
    [CreditCard,'Direct Deposit','Funds deposited into employee accounts on time, every time — plus pay cards and checks if needed.'],
    [FileCheck,'Tax Deposits & Filings','Federal and California payroll taxes deposited on schedule and all returns (941, 940, DE 9) filed for you.'],
    [FileText,'W-2, W-3 & 1099','Year-end forms prepared, filed with agencies, and distributed to employees and contractors.'],
    [ShieldCheck,'Compliance Management','New-hire reporting, sick leave accrual, wage statements, and workers comp — all kept compliant.'],
    [Users,'Employee Self-Service','A portal where employees view pay stubs, W-2s, PTO balances, deductions, and update their own info.'],
    [BarChart3,'Custom Reports','Labor cost reports, tax liability summaries, and departmental breakdowns tailored to your business.'],
    [BookOpen,'Bookkeeping Integration','Payroll flows directly into your books — no double entry, no reconciliation headaches.'],
  ];

  const comparison = [
    [SlidersHorizontal,'Flexibility','The giants make you adapt to their system. We adapt our system to you — your pay cycles, your structure, your rules.'],
    [Phone,'Real Relationships','No call centers. No ticket numbers. A dedicated specialist who picks up the phone and already knows your business.'],
    [MapPin,'Local & Integrated','Bay Area-based, California-compliant, and connected to your bookkeeping and taxes — one team, total coverage.'],
  ];

  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services',to:'/services'},{label:'Payroll Management'}]}
        label="Our Services"
        title="Payroll Management"
        description="Payroll looks simple — until a tax deposit is missed, a form is filed wrong, or an employee questions their paycheck. Then it becomes a nightmare. We make sure it never does."
      />

      <section className="section bg-surface" style={{paddingTop:'40px'}}>
        <div className="container">
          <SectionHeader
            label="The Hidden Crisis No One Talks About"
            title="One missed filing turns payroll<br/><span class='accent'>into a nightmare.</span>"
            sub="Payroll isn't just cutting checks. It's a web of tax deposits, federal and state forms, and employee obligations — and a single misstep triggers penalties, audits, and a loss of your team's trust."
          />

          <PainGroup icon={AlertTriangle} title="Penalties & Compliance" items={penalties}/>
          <PainGroup icon={Files} title="Forms, Reports & Deadlines" items={forms}/>
          <PainGroup icon={Users} title="Employee Experience" items={employee}/>

          <blockquote style={{maxWidth:'760px',margin:'0 auto',padding:'28px 32px',borderLeft:'4px solid var(--accent)',borderRadius:'0 16px 16px 0',background:'rgba(212,0,31,.04)',fontSize:'17px',lineHeight:1.7,fontStyle:'italic',color:'var(--tm)'}}>
            &ldquo;Your employees don&apos;t see the tax deposits, the form filings, or the compliance deadlines. They just see a paycheck that&apos;s right, on time, every time. We make sure that&apos;s all they ever have to see.&rdquo;
          </blockquote>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            label="What You Get"
            title="Full-service payroll,<br/>powered by the right software."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
            {services.map(([Icon,h,p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <div className="feat-icon"><Icon size={25} strokeWidth={1.8}/></div>
                <h4>{h}</h4>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>

          <div style={{marginTop:'60px',padding:'36px',borderRadius:'20px',background:'rgba(212,0,31,.04)',border:'1px solid rgba(212,0,31,.12)'}}>
            <h3 className="serif" style={{fontSize:'22px',marginBottom:'12px'}}>Payroll Software, Customized to Your Business</h3>
            <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.7,maxWidth:'720px'}}>Every business runs differently — hourly vs. salaried, multiple locations, tips, commissions, contractors, union rules. We set up and customize your payroll platform to fit exactly how you operate, then manage it for you. As a BAAS client, you also get discounted software rates.</p>
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <SectionHeader
            label="Why BAAS"
            title="Why we beat ADP & Paychex<br/>where it matters most."
          />
          <div className="compare-grid">
            {comparison.map(([Icon,t,d]) => (
              <div key={t} style={{padding:'36px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px',color:'var(--accent)'}}>
                  <Icon size={26} strokeWidth={1.8}/>
                  <h3 className="serif" style={{fontSize:'22px'}}>{t}</h3>
                </div>
                <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.7}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="content-grid">
            <RevealWrapper className="prose" delay={0.1}>
              <h2>Request Your Payroll Quote</h2>
              <p>Tell us about your team and we&apos;ll send a custom payroll proposal within 24 hours — flexible, transparent, and built around your business.</p>
              <PayrollQuoteForm/>
              <p style={{fontSize:'14px',color:'var(--td)',marginTop:'16px',textAlign:'center'}}>We respond within 24 hours. No long-term contracts. No hidden fees. Just flexible payroll done right.</p>
            </RevealWrapper>
            <aside>
              <RevealWrapper delay={0.2}>
                <div className="sidebar-card">
                  <h4>Other Services</h4>
                  {[['Bookkeeping & Accounting','/services/bookkeeping'],['Business & Individual Taxes','/services/tax-services'],['Accounting Cleanup','/services/accounting'],['Business Formation','/services/consulting']].map(([l,to]) => (
                    <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                  ))}
                </div>
                <div className="sidebar-cta">
                  <h4>Payroll Audit</h4>
                  <p>Let us review your current payroll setup and identify compliance gaps — free.</p>
                  <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{width:'100%',justifyContent:'center'}}>Book Free Call</a>
                </div>
              </RevealWrapper>
            </aside>
          </div>
        </div>
      </section>

      <CtaBar heading="Tired of being just an account number?" sub="Switch to payroll that flexes around your business — and a team that actually picks up the phone."/>
    </>
  );
}
