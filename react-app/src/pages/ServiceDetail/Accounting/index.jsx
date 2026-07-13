import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, FolderOpen, Copy, FileX, Search, RefreshCw, ListChecks, FileText, Settings, TrendingUp, CheckCircle, Phone, Mail } from 'lucide-react';
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

function CleanupQuoteForm() {
  const [form, setForm] = useState({ name:'', email:'', biz:'', behind:'' });
  const [status, setStatus] = useState('idle');
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.biz) { setStatus('error'); setTimeout(() => setStatus('idle'), 2500); return; }
    setStatus('sending');
    setTimeout(() => { setStatus('sent'); setTimeout(() => setStatus('idle'), 4000); }, 1500);
  };

  if (status === 'sent') {
    return (
      <div style={{marginTop:'24px',padding:'40px 32px',borderRadius:'20px',background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.35)',textAlign:'center'}}>
        <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'rgba(74,222,128,.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',color:'#22c55e'}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h3 className="serif" style={{fontSize:'24px',marginBottom:'10px',color:'#1a1a1a'}}>Thank you — we received your cleanup request.</h3>
        <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.6,maxWidth:'440px',margin:'0 auto 24px'}}>We&apos;ll review your situation and send a flat-fee cleanup quote within 24 hours. No judgment, just a clear path forward.</p>
        <button type="button" onClick={() => setStatus('idle')} className="btn-ghost" style={{margin:'0 auto'}}>Submit another request</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{marginTop:'24px',padding:'32px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)',boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04)'}}>
      {[['name','Full Name','text','Jane Smith'],['email','Email','email','you@company.com'],['biz','Business Name','text','Your Company LLC']].map(([k,l,t,p]) => (
        <div className="form-group" key={k}><label>{l} *</label><input type={t} className="form-input" placeholder={p} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}/></div>
      ))}
      <div className="form-group"><label>How far behind are your books?</label>
        <select className="form-input" value={form.behind} onChange={e => setForm(f => ({...f,behind:e.target.value}))}>
          <option value="">Select...</option>
          {['1–3 months','4–6 months','7–12 months','1–2 years','2+ years'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <button type="submit" className="form-submit" style={{marginTop:'8px'}}>
        {status==='error'?'Please fill required fields':status==='sending'?'Sending...':'Get My Cleanup Quote'}
      </button>
    </form>
  );
}

export default function Accounting() {
  useEffect(() => { document.title = 'Accounting & Bookkeeping Cleanup | BAAS'; }, []);

  const problems = [
    [Scale,'Balances don\'t match','Your QuickBooks balance and real bank balance are completely different numbers.'],
    [FolderOpen,'Uncategorized expenses','Months of transactions sitting in "Uncategorized" or assigned to the wrong accounts.'],
    [Copy,'Duplicate transactions','The same entries appearing multiple times, inflating or deflating your real numbers.'],
    [FileX,'Unreliable reports','Your P&L and balance sheet are essentially fiction at this point.'],
  ];

  const help = [
    [Search,'Full Audit','We review every transaction, identify errors, duplicates, and misclassifications across your entire history.'],
    [RefreshCw,'Reconciliation','Bank accounts, credit cards, loans — everything reconciled to the penny.'],
    [ListChecks,'Re-categorization','Every transaction properly categorized according to accounting standards and your business needs.'],
    [FileText,'Clean Reports','Accurate P&L, balance sheet, and cash flow statements you can actually trust and use.'],
    [Settings,'System Setup','QuickBooks configured correctly with proper chart of accounts, rules, and automations.'],
    [TrendingUp,'Going-Forward Plan','We don\'t just clean up — we set you up with systems to keep books clean permanently.'],
  ];

  const reasons = [
    'Specialists in "rescue bookkeeping" — we\'ve seen it all and fixed it all',
    'No judgment — just efficient, thorough cleanup of any size mess',
    'QuickBooks Online and Desktop expertise',
    'Flat-fee cleanup pricing so you know the cost upfront',
    'Transition to ongoing bookkeeping service for seamless maintenance',
    'Free initial assessment to scope the cleanup before you commit',
  ];

  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services',to:'/services'},{label:'Accounting Cleanup'}]}
        label="Our Services"
        title="Bookkeeping Cleanup Services"
        description="Professional bookkeeping cleanup services in the Bay Area. We fix messy books, reconcile accounts, and get your financials back on track."
      />

      <section className="section bg-surface" style={{paddingTop:'40px'}}>
        <div className="container">
          <SectionHeader
            title="Is your QuickBooks a disaster zone?"
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}} className="pain-grid">
            {problems.map(([Icon,t,d]) => (
              <motion.div variants={fadeUp} key={t} className="pain-card">
                <div style={{fontSize:'31px',marginBottom:'12px',color:'var(--accent)'}}><Icon size={31} strokeWidth={1.5}/></div>
                <h3 className="serif" style={{fontSize:'18px',marginBottom:'8px'}}>{t}</h3>
                <p style={{fontSize:'15px',color:'var(--td)',lineHeight:1.6}}>{d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            title="How We Help"
            sub="Our bookkeeping cleanup service takes your messy, inaccurate books and transforms them into a clean, reliable financial foundation. We've rescued hundreds of businesses from QuickBooks chaos — no judgment, just results."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            {help.map(([Icon,h,p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <div className="feat-icon"><Icon size={25} strokeWidth={1.8}/></div>
                <h4>{h}</h4>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="content-grid">
            <RevealWrapper className="prose" delay={0.1}>
              <h2>Why Choose BAAS for Cleanup?</h2>
              <ul>
                {reasons.map(r => (
                  <li key={r} style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
                    <span style={{color:'var(--accent)',flexShrink:0,marginTop:'2px'}}><CheckCircle size={18}/></span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <h2 style={{marginTop:'48px'}}>Request a Cleanup Quote</h2>
              <p>Cleanup pricing depends on how far behind your books are and the volume of transactions. Tell us where you are and we&apos;ll give you a flat-rate quote — no surprises.</p>
              <CleanupQuoteForm/>
            </RevealWrapper>
            <aside>
              <RevealWrapper delay={0.2}>
                <div className="sidebar-card">
                  <h4>Other Services</h4>
                  {[['Bookkeeping & Accounting','/services/bookkeeping'],['Business & Individual Taxes','/services/tax-services'],['Payroll Management','/services/payroll'],['Business Formation','/services/consulting']].map(([l,to]) => (
                    <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                  ))}
                </div>
                <div className="sidebar-cta">
                  <h4>Need Help?</h4>
                  <p>Schedule a free 30-minute clarity session with our team. No obligation.</p>
                  <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{width:'100%',justifyContent:'center'}}>Book Free Call</a>
                </div>
                <div className="sidebar-card" style={{marginTop:'20px'}}>
                  <h4>Contact</h4>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px',fontSize:'15px',color:'var(--tm)'}}>
                    <Phone size={16} style={{color:'var(--accent)'}}/> <a href="tel:+15109627300" style={{color:'var(--accent)'}}>(510) 962-7300</a>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'15px',color:'var(--tm)'}}>
                    <Mail size={16} style={{color:'var(--accent)'}}/> <a href="mailto:info@bayareaaccountingsolutions.com" style={{color:'var(--accent)',wordBreak:'break-all'}}>info@bayareaaccountingsolutions.com</a>
                  </div>
                </div>
              </RevealWrapper>
            </aside>
          </div>
        </div>
      </section>

      <CtaBar heading="Ready to get started?" sub="Let us handle your bookkeeping cleanup services so you can focus on growing your business."/>
    </>
  );
}
