import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Home, ShieldAlert, CalendarClock, MapPin, ScanLine, Eye, Globe, Clock, CheckCircle, Phone, ChevronDown } from 'lucide-react';
import RevealWrapper from '../../../components/UI/RevealWrapper';
import PageHero from '../../../components/Sections/PageHero';
import CtaBar from '../../../components/Sections/CtaBar';

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

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{borderBottom:'1px solid var(--border)'}}>
      <button onClick={() => setOpen(!open)} style={{width:'100%',textAlign:'left',padding:'20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',background:'none',border:'none',cursor:'pointer'}}>
        <span style={{fontSize:'17px',fontWeight:600,color:'#1a1a1a'}}>{question}</span>
        <ChevronDown size={20} style={{transform:open?'rotate(180deg)':'none',transition:'transform .2s',color:'var(--accent)',flexShrink:0}}/>
      </button>
      {open && <p style={{fontSize:'15px',color:'var(--tm)',lineHeight:1.7,paddingBottom:'20px',marginTop:'-8px'}}>{answer}</p>}
    </div>
  );
}

export default function RegisteredAgent() {
  useEffect(() => { document.title = 'Registered Agent Services | BAAS'; }, []);

  const pain = [
    [Mail,'Worried About Missing Mail?','Worried about missing state or IRS correspondence that requires urgent action?'],
    [Home,'Working from Home?','Need a California address for legal notices but don\'t want to expose your home address publicly?'],
    [ShieldAlert,'Risk of Lawsuits at Your Door','Don\'t want lawsuits or legal summons delivered directly to your front door or personal address?'],
    [CalendarClock,'Tired of Tracking Deadlines?','Tired of managing compliance reminders yourself and risking missed filing deadlines?'],
  ];

  const included = [
    [MapPin,'Registered Office Address','We provide a real, professional address in California to receive legal and tax documents on your behalf.'],
    [ScanLine,'Document Handling & Scanning','We receive and securely scan all legal documents — then notify and deliver them to you immediately.'],
    [Clock,'Compliance Monitoring','We track your annual report and renewal deadlines to help you avoid late fees or suspension.'],
    [Eye,'Privacy Protection','Use our business address instead of your home to protect your personal privacy from public business listings.'],
    [Globe,'Multi-State Support','Need agents in more than one state? We can coordinate multi-state registered agent services as an optional add-on.'],
  ];

  const why = [
    ['Real Local Presence','We\'re based in the Bay Area, not a faceless nationwide mailroom. You\'ll get personal support and fast service.'],
    ['Same-Day Notifications','You\'ll never miss a deadline — we notify you the same day your document arrives.'],
    ['Built for Small Businesses','Whether you\'re a solo entrepreneur or have a growing team, our service scales with you.'],
    ['Bundle & Save','Use us for business formation and registered agent service together for discounted pricing.'],
    ['Secure Portal Access','All documents stored securely online, available 24/7 in your private portal.'],
  ];

  const steps = [
    ['01','Choose Your Plan','We offer simple pricing — just choose your plan and sign up in minutes.'],
    ['02','We File the Change','If you already have a business, we handle the paperwork to switch your registered agent.'],
    ['03','Legal Notices Come to Us','We receive any state or federal correspondence on your behalf — and notify you instantly.'],
    ['04','Stay Compliant Year After Year','We track and remind you about renewals, compliance filings, and anything that requires attention.'],
  ];

  const faqs = [
    { q:'What is a registered agent?', a:'A registered agent is a legal requirement — someone who receives government and legal documents on behalf of your business.' },
    { q:'Can I be my own registered agent?', a:'Yes, but that makes your address public and risks missing critical notices. We recommend appointing a professional.' },
    { q:'How quickly will I receive my documents?', a:'Yes — we notify you the same day, and upload all documents to your secure client portal so you have instant, 24/7 access.' },
    { q:'What if I need registered agents in multiple states?', a:'We can help coordinate agent services across states to keep everything under one roof.' },
  ];

  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services',to:'/services'},{label:'Registered Agent'}]}
        label="Our Services"
        title="Registered Agent"
        description="A registered agent isn't optional — it's a legal requirement. At Bay Area Accounting Solutions, we help protect your privacy, keep you compliant, and never miss a legal notice or tax deadline again."
      />

      <section className="section bg-surface" style={{paddingTop:'40px'}}>
        <div className="container">
          <SectionHeader
            label="The Hidden Crisis No One Talks About"
            title="Missing Legal Notices Could<br/>Cost You Everything"
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true,margin:'-60px'}} className="pain-grid">
            {pain.map(([Icon,t,d]) => (
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
            title="What\'s Included in Our Registered Agent Services"
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
            {included.map(([Icon,h,p]) => (
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
          <SectionHeader title="Why Choose Bay Area Accounting Solutions?"/>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
            {why.map(([h,p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <div className="feat-icon"><CheckCircle size={25} strokeWidth={1.8}/></div>
                <h4>{h}</h4>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader title="How It Works"/>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="steps-grid">
            {steps.map(([n,t,d]) => (
              <motion.div variants={fadeUp} key={n} className="step-card">
                <div className="step-bg" aria-hidden="true">{n}</div>
                <div className="step-num">{n}</div>
                <h3 className="serif" style={{fontSize:'19px',marginBottom:'10px',position:'relative'}}>{t}</h3>
                <p style={{fontSize:'15px',color:'var(--td)',lineHeight:1.6,position:'relative'}}>{d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <SectionHeader title="Frequently Asked Questions"/>
          <div style={{maxWidth:'720px',margin:'0 auto',padding:'28px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)'}}>
            {faqs.map(({q,a}) => <FaqItem key={q} question={q} answer={a}/>)}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <RevealWrapper delay={0.1}>
            <div className="content-grid">
              <div className="prose">
                <h2>About Our Registered Agent Service</h2>
                <p>As a business owner, you know that complying with state regulations is crucial for your success. One of these requirements is having a registered agent. A registered agent is an individual or entity that is responsible for receiving legal and tax documents on behalf of your business. At Bay Area Accounting Solutions, we offer registered agent services to help you stay compliant and focused on growing your business.</p>
              </div>
              <aside>
                <div className="sidebar-card">
                  <h4>Our Services</h4>
                  {[['Bookkeeping & Accounting','/services/bookkeeping'],['Business & Individual Taxes','/services/tax-services'],['Payroll Management','/services/payroll'],['Accounting Cleanup','/services/accounting'],['Business Formation','/services/consulting']].map(([l,to]) => (
                    <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                  ))}
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
              </aside>
            </div>
          </RevealWrapper>
        </div>
      </section>

      <CtaBar heading="Get Peace of Mind with a Professional Registered Agent" sub="Avoid late penalties, legal confusion, and public privacy exposure. We've got your back — all year long."/>
    </>
  );
}
