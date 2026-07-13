import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Coins, ShieldOff, TrendingDown, User, Building2, Percent, Landmark, Users, Heart, Compass, FileText, Fingerprint, FileCheck, PercentCircle, Award, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
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

function ConsultForm() {
  const [form, setForm] = useState({ name:'', email:'', biz:'', entity:'', question:'' });
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
        <h3 className="serif" style={{fontSize:'24px',marginBottom:'10px',color:'#1a1a1a'}}>Thank you — your consultation request is on its way.</h3>
        <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.6,maxWidth:'440px',margin:'0 auto 24px'}}>We&apos;ll assess your situation and recommend the structure and certifications that maximize protection, savings, and growth.</p>
        <button type="button" onClick={() => setStatus('idle')} className="btn-ghost" style={{margin:'0 auto'}}>Submit another request</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{marginTop:'24px',padding:'32px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)',boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04)'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
        <div className="form-group"><label>Full Name *</label><input type="text" className="form-input" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))}/></div>
        <div className="form-group"><label>Business Name *</label><input type="text" className="form-input" placeholder="Your Future LLC" value={form.biz} onChange={e => setForm(f => ({...f,biz:e.target.value}))}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
        <div className="form-group"><label>Email Address *</label><input type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))}/></div>
        <div className="form-group"><label>Entity You\'re Considering</label>
          <select className="form-input" value={form.entity} onChange={e => setForm(f => ({...f,entity:e.target.value}))}>
            <option value="">Select type...</option>
            {['Not sure yet','Sole Proprietorship','LLC','S-Corporation','C-Corporation','LLP','Non-Profit 501(c)(3)'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group" style={{marginTop:'8px'}}>
        <label>Tell us about your business</label>
        <textarea className="form-input" rows={3} placeholder="What you do, how many owners, goals, concerns..." value={form.question} onChange={e => setForm(f => ({...f,question:e.target.value}))}/>
      </div>
      <button type="submit" className="form-submit" style={{marginTop:'8px'}}>
        {status==='error'?'Please fill required fields':status==='sending'?'Sending...':'Book My Free Clarity Session'}
      </button>
    </form>
  );
}

export default function Consulting() {
  useEffect(() => { document.title = 'Business Formation & Consulting | BAAS'; }, []);

  const pain = [
    [Brain,'Analysis paralysis','Six structures, each with different tax, liability, and compliance rules. Most founders freeze — or worse, default to whatever a friend chose, which may be completely wrong for them.'],
    [Coins,'Costly tax mistakes','Pick the wrong structure and you could overpay self-employment tax by thousands every year — or miss out on deductions and credits only available to certain entities.'],
    [ShieldOff,'Personal liability exposure','Operate without the right entity and a business lawsuit or debt can reach your home, savings, and personal assets. The wrong choice leaves you unprotected.'],
    [TrendingDown,'Blocked growth & funding','Investors won\'t fund an LLC. Some structures can\'t issue stock or add partners easily. Choose wrong and you may have to restructure later — expensive and disruptive.'],
  ];

  const structures = [
    [User,'Sole Proprietorship','The simplest structure — you and the business are legally the same. No formal filing required to start.'],
    [Building2,'LLC (Limited Liability Company)','A flexible hybrid that protects your personal assets while keeping taxes simple. The most popular choice for small businesses.'],
    [Percent,'S Corporation','Not an entity type but a tax election (for LLCs or corporations) that can dramatically reduce self-employment taxes.'],
    [Landmark,'C Corporation','A fully separate legal and tax entity. The standard for businesses seeking investors or planning to scale big.'],
    [Users,'LLP (Limited Liability Partnership)','A partnership where each partner is protected from the others\' liabilities. Common in licensed professions.'],
    [Heart,'Non-Profit (501(c)(3))','A mission-driven organization exempt from federal income tax. Profits must serve the organization\'s purpose.'],
  ];

  const structureGuide = [
    ['You want maximum simplicity','Sole Proprietorship or single-member LLC'],
    ['You want liability protection + flexibility','LLC'],
    ['You want to save on self-employment tax','LLC taxed as S-Corp'],
    ['You plan to raise investor funding','C-Corporation (Delaware often preferred)'],
    ['You\'re a licensed professional partnership','LLP or PC'],
    ['You\'re building a mission-driven organization','Non-Profit 501(c)(3)'],
  ];

  const myths = [
    ['Myth: LLCs are always the best choice.','Fact: LLCs are flexible, but the right choice depends on taxes, growth plans, and ownership structure. Sometimes an S-Corp or C-Corp saves far more.'],
    ['Myth: You can just switch later.','Fact: Restructuring later is possible, but it\'s expensive, taxable, and disruptive. Getting it right from day one is far cheaper.'],
    ['Myth: Incorporating protects you from everything.','Fact: Corporate protection can be pierced if you mix personal and business funds, skip formalities, or undercapitalize the entity.'],
  ];

  const certs = [
    ['Women-Owned (WBE / WOSB)','Certification for businesses at least 51% woman-owned. Unlocks federal WOSB set-asides and corporate supplier diversity programs.'],
    ['Minority-Owned (MBE)','For businesses 51%+ owned by minority group members. Opens NMSDC corporate networks and government contracting.'],
    ['Veteran-Owned (VOSB / SDVOSB)','For veteran and service-disabled veteran owners. Access to VA set-asides and federal contracting preferences.'],
    ['Small Business (SBA 8(a))','SBA’s program for socially & economically disadvantaged owners — a powerful federal contracting advantage.'],
    ['LGBTQ-Owned (LGBTBE)','NGLCC certification connecting you to corporations actively seeking diverse suppliers.'],
    ['Disability-Owned (DOBE)','Certification for disability-owned businesses through Disability:IN supplier programs.'],
    ['HUBZone','For businesses in Historically Underutilized Business Zones — federal contracting set-asides.'],
    ['DBE (Disadvantaged Business)','For transportation and infrastructure contracts funded by the U.S. DOT.'],
  ];

  const included = [
    [Compass,'Entity Selection','Expert guidance on the structure that fits your goals, tax situation, and growth plans.'],
    [FileText,'State Filing','Articles of organization/incorporation filed correctly with the California Secretary of State.'],
    [Fingerprint,'EIN Registration','Federal EIN obtained from the IRS — required for banking, hiring, and tax filing.'],
    [FileCheck,'Operating Agreement','Custom operating agreement or corporate bylaws drafted to protect your interests.'],
    [Building2,'Banking Setup','Guidance on opening business bank accounts and building business credit.'],
    [PercentCircle,'Tax Election','Optimal tax setup including S-Corp election when it benefits you.'],
    [Award,'Certifications','Minority, women, veteran, and other certifications to expand your opportunities.'],
    [RefreshCw,'Ongoing Support','Seamless transition into bookkeeping, payroll, and tax services.'],
  ];

  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services',to:'/services'},{label:'Business Formation & Consulting'}]}
        label="Our Services"
        title="Business Formation"
        description="Choosing your business structure is the single most consequential decision you'll make as a founder — it shapes your taxes, your liability, and your growth. We make the confusing clear."
      />

      <section className="section bg-surface" style={{paddingTop:'40px'}}>
        <div className="container">
          <SectionHeader
            label="The Hidden Crisis No One Talks About"
            title="One choice. Years of<br/><span class='accent'>consequences.</span>"
            sub="Sole prop? LLC? S-Corp? C-Corp? The wrong structure can cost you thousands in taxes, expose your personal assets, or block you from funding. Let's walk through every option — clearly."
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
            title="Every business structure, explained"
            sub="Here's a plain-English breakdown of the six main structures — what each one is, who it fits, and the tradeoffs."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            {structures.map(([Icon,h,p]) => (
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
          <SectionHeader title="Which structure is right for you?" sub="A quick eligibility guide based on what matters most to your business. We'll confirm the best fit in your free consultation."/>
          <div style={{maxWidth:'720px',margin:'0 auto',padding:'28px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)'}}>
            {structureGuide.map(([q,a]) => (
              <div key={q} style={{display:'flex',justifyContent:'space-between',gap:'16px',padding:'16px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:'16px',color:'var(--tm)'}}>{q}</span>
                <span style={{fontSize:'16px',fontWeight:600,color:'#1a1a1a',textAlign:'right'}}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader title="Myth vs. Fact" sub="The internet is full of business-structure misinformation. Let's set the record straight."/>
          <div className="compare-grid">
            {myths.map(([m,f]) => (
              <div key={m} style={{padding:'28px',borderRadius:'16px',background:'var(--card)',border:'1px solid var(--cb)'}}>
                <div style={{display:'flex',gap:'10px',alignItems:'flex-start',marginBottom:'16px'}}>
                  <XCircle size={20} style={{color:'var(--accent)',flexShrink:0,marginTop:'2px'}}/> <h4 style={{fontSize:'17px',fontWeight:600}}>{m}</h4>
                </div>
                <div style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                  <CheckCircle size={20} style={{color:'#22c55e',flexShrink:0,marginTop:'2px'}}/> <p style={{fontSize:'15px',color:'var(--tm)',lineHeight:1.6,margin:0}}>{f}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <SectionHeader
            title="Business certifications that<br/>grow your scope & profit."
            sub="Your status as a minority, woman, veteran, or other qualifying owner can open doors to set-aside government contracts, corporate supplier programs, grants, and funding — worth billions annually. We help you get certified."
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
            {certs.map(([h,p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <h4>{h}</h4>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>
          <div style={{marginTop:'40px',padding:'28px',borderRadius:'16px',background:'rgba(212,0,31,.04)',border:'1px solid rgba(212,0,31,.12)'}}>
            <h3 className="serif" style={{fontSize:'20px',marginBottom:'10px'}}>Why certification matters</h3>
            <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.7,margin:0}}>Federal, state, and local governments set aside a percentage of contracts specifically for certified diverse businesses. Major corporations have supplier diversity mandates worth billions. Certification can transform your scope of work and profitability.</p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            title="Everything you need to start right"
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
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
          <div className="content-grid">
            <RevealWrapper className="prose" delay={0.1}>
              <h2>Not sure which structure is right?</h2>
              <p>Book a free consultation — we&apos;ll assess your situation and recommend the structure and certifications that maximize protection, savings, and growth.</p>
              <ConsultForm/>
            </RevealWrapper>
            <aside>
              <RevealWrapper delay={0.2}>
                <div className="sidebar-card">
                  <h4>Other Services</h4>
                  {[['Bookkeeping & Accounting','/services/bookkeeping'],['Business & Individual Taxes','/services/tax-services'],['Payroll Management','/services/payroll'],['Accounting Cleanup','/services/accounting']].map(([l,to]) => (
                    <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                  ))}
                </div>
                <div className="sidebar-cta">
                  <h4>Entity Consultation</h4>
                  <p>Not sure which entity is right? We&apos;ll walk you through the pros and cons for your specific situation.</p>
                  <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{width:'100%',justifyContent:'center'}}>Book Free Call</a>
                </div>
              </RevealWrapper>
            </aside>
          </div>
        </div>
      </section>

      <CtaBar heading="Ready to launch the right way?" sub="We'll handle the formation so you can focus on building your business."/>
    </>
  );
}
