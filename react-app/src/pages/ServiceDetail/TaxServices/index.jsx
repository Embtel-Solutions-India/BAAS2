import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CloudFog, Receipt, FileWarning, Percent, CalendarClock, Building2, Users, Clock, PiggyBank, Dices, TrendingDown, Shuffle, Coins, Flag, FileX, UserCheck, BookOpen, CalendarDays, FileText, User, Calculator, ShieldCheck, RefreshCw, Inbox, Search, Send } from 'lucide-react';
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

function TaxUploadForm() {
  const [form, setForm] = useState({ name:'', email:'', filingType:'' });
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const addFiles = (newFiles) => setFiles(f => [...f, ...Array.from(newFiles).map(x => ({ name: x.name, size: (x.size/1024).toFixed(1)+' KB' }))]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.filingType) { setStatus('error'); setTimeout(() => setStatus('idle'), 2500); return; }
    if (!files.length) { setStatus('noFiles'); setTimeout(() => setStatus('idle'), 2500); return; }
    setStatus('sending');
    setTimeout(() => { setStatus('sent'); setTimeout(() => { setStatus('idle'); setFiles([]); }, 4000); }, 1800);
  };

  if (status === 'sent') {
    return (
      <div style={{marginTop:'24px',padding:'40px 32px',borderRadius:'20px',background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.35)',textAlign:'center'}}>
        <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'rgba(74,222,128,.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',color:'#22c55e'}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h3 className="serif" style={{fontSize:'24px',marginBottom:'10px',color:'#1a1a1a'}}>Documents received — thank you.</h3>
        <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.6,maxWidth:'440px',margin:'0 auto 24px'}}>We&apos;ll review and organize your tax documents within 1 business day and reach out with next steps.</p>
        <button type="button" onClick={() => setStatus('idle')} className="btn-ghost" style={{margin:'0 auto'}}>Upload more documents</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{marginTop:'24px',padding:'32px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)',boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04)'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
        <div className="form-group"><label>Full Name *</label><input type="text" className="form-input" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))}/></div>
        <div className="form-group"><label>Email *</label><input type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))}/></div>
      </div>
      <div className="form-group">
        <label>Filing Type *</label>
        <select className="form-input" value={form.filingType} onChange={e => setForm(f => ({...f,filingType:e.target.value}))}>
          <option value="">Select filing type...</option>
          {['Business Tax Return (S-Corp)','Business Tax Return (C-Corp)','Business Tax Return (Partnership)','Individual (1040)','Self-Employed (Schedule C)','Amended Return','Multiple Years'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div
        className={`upload-zone${dragging?' dragover':''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        role="button" tabIndex={0} aria-label="Upload tax documents"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'rgba(0,0,0,0.42)',marginBottom:'12px'}} aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p style={{fontSize:'16px',color:'rgba(0,0,0,0.7)',marginBottom:'4px'}}>Drop tax documents here or <span style={{color:'var(--accent)',textDecoration:'underline'}}>browse</span></p>
        <small style={{fontSize:'13px',color:'rgba(0,0,0,0.42)'}}>W-2, 1099, bank statements, receipts — PDF, JPG, XLSX — Max 25MB</small>
        <input ref={fileRef} type="file" multiple style={{display:'none'}} onChange={e => addFiles(e.target.files)} aria-label="File input"/>
      </div>
      {files.map((f,i) => (
        <div className="file-item" key={i}>
          <div><div style={{fontSize:'15px'}}>{f.name}</div><div style={{fontSize:'13px',color:'var(--tf)'}}>{f.size}</div></div>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'13px',color:'var(--accent)'}}>✓ Ready</span>
            <button onClick={() => setFiles(fs => fs.filter((_,j) => j!==i))} style={{background:'none',border:'none',color:'var(--td)',cursor:'pointer',fontSize:'18px'}} aria-label={`Remove ${f.name}`}>×</button>
          </div>
        </div>
      ))}
      <button type="submit" className="form-submit" style={{marginTop:'12px'}}>
        {status==='error' ? 'Please fill name, email & filing type' : status==='noFiles' ? 'Please upload at least one document' : status==='sending' ? 'Uploading securely...' : 'Submit Documents Securely'}
      </button>
    </form>
  );
}

export default function TaxServices() {
  useEffect(() => { document.title = 'Business & Individual Tax Services | BAAS'; }, []);

  const deadlines = [
    [FileWarning,'Failure-to-file penalties stack up fast','The IRS charges 5% of unpaid taxes per month for filing late — up to 25% of what you owe. On a $20,000 tax bill, that\'s $5,000 in penalties alone, before interest. Miss one deadline and you\'ve handed the government thousands for nothing.'],
    [Percent,'Interest compounds daily','On top of penalties, the IRS charges interest that compounds daily on unpaid balances. What started as a manageable bill quietly grows every single day until it\'s paid. The longer you wait, the deeper the hole.'],
    [CalendarClock,'Quarterly estimates slip through the cracks','Self-employed and business owners owe estimated taxes four times a year — April, June, September, January. Miss one and you face underpayment penalties even if you pay in full at year-end. Most owners don\'t even know these deadlines exist until it\'s too late.'],
    [Building2,'Business filing deadlines are different','S-Corps and partnerships file by March 15, not April 15. Miss it and the penalty is $245 per partner/shareholder, per month. A 3-partner LLC that files two months late owes $1,470 in penalties — for a return that may show zero tax due.'],
    [Users,'Payroll & 1099 deadlines carry separate fines','W-2s and 1099s are due to recipients and the IRS by January 31. Late filing penalties range from $60 to $310 per form. For a business with 15 contractors, missing the 1099 deadline can mean thousands in avoidable fines.'],
  ];

  const cash = [
    [Receipt,'The year-end surprise bill','Nothing is worse than finishing a profitable year only to discover you owe $30,000 you didn\'t set aside. Without ongoing visibility into your tax liability, every April becomes a gamble — and sometimes the house wins big.'],
    [PiggyBank,'No cash reserved for taxes','When you don\'t know what you owe, you can\'t plan for it. You spend or reinvest money that was actually the government\'s, then scramble to find cash when the bill comes due — often resorting to high-interest debt or payment plans.'],
    [Dices,'Estimated payments are pure guesswork','Most business owners either overpay quarterly estimates (starving cash flow) or underpay (triggering penalties). Without real numbers, you\'re flying blind — and either way, you lose.'],
    [TrendingDown,'Can\'t make smart year-end moves','Smart tax moves — buying equipment, contributing to retirement, deferring income — only work if you know your position before December 31. Without clarity, you miss the window to legally reduce what you owe.'],
    [Shuffle,'Personal and business taxes tangled together','For most SMB owners, personal and business taxes are deeply intertwined — pass-through income, owner draws, home office, vehicle use. Without expertise, you either miss savings or raise audit flags by getting it wrong.'],
  ];

  const deductions = [
    [Coins,'Leaving money on the table','Home office, mileage, software subscriptions, professional development, business meals, health insurance premiums — most owners miss thousands in legitimate deductions every year simply because they don\'t know what qualifies or didn\'t track it.'],
    [Flag,'Over-claiming triggers audits','On the flip side, aggressive or incorrect deductions are red flags. Claiming 100% of a vehicle, deducting personal expenses, or inflating home office percentages can invite an audit — and penalties for getting it wrong.'],
    [FileX,'No documentation = no deduction','Even legitimate expenses get disallowed without proper records. If you can\'t produce receipts, mileage logs, or proof of business purpose during an audit, the IRS strips the deduction and adds penalties. Memory isn\'t documentation.'],
    [UserCheck,'Individual filers miss credits too','It\'s not just businesses. Individuals miss education credits, child care credits, retirement savings credits, energy credits, and itemized deductions — overpaying simply because they took the standard deduction without checking if itemizing saved more.'],
    [BookOpen,'The rules change every year','Tax law is a moving target. Deduction limits, credit phase-outs, depreciation rules, and thresholds shift annually. What was deductible last year may not be this year. Keeping up is a full-time job — which is exactly why you need a professional who does.'],
  ];

  const services = [
    [CalendarDays,'Year-Round Tax Planning','Quarterly strategy sessions to project your liability, set aside the right cash, and make smart moves before December 31.'],
    [FileText,'Tax Preparation & Filing','Accurate, on-time preparation for individuals, LLCs, S-Corps, C-Corps, partnerships, and non-profits — federal and all states.'],
    [Building2,'Business Tax Returns','Entity returns, quarterly estimates, multi-state compliance, and pass-through income handled seamlessly.'],
    [User,'Individual Tax Returns','Personal returns including W-2, investments, rental income, freelance, capital gains, and complex multi-source situations.'],
    [Calculator,'Deduction Maximization','We identify and document every deduction and credit you legally qualify for — without raising audit flags.'],
    [Clock,'Deadline Tracking','Every filing date monitored: April 15, March 15, quarterly estimates, W-2s, 1099s. You never miss one.'],
    [ShieldCheck,'IRS Representation','Enrolled Agents licensed to represent you in audits, notices, and disputes — we stand beside you.'],
    [RefreshCw,'Tax Savings Review','We review prior years for missed deductions and may amend returns to recover overpaid taxes.'],
  ];

  const uploadSteps = [
    [Inbox,'We receive & organize','Your documents are auto-sorted and reviewed by your dedicated tax preparer within 1 business day.'],
    [Search,'We identify savings','We cross-check every deduction and credit, then flag anything missing before filing.'],
    [Send,'We file on time','Your return is prepared, reviewed, sent to you for approval, and filed before the deadline.'],
  ];

  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services',to:'/services'},{label:'Tax Services'}]}
        label="Our Services"
        title={<>{'Business &'}<br/>{'Individual Taxes'}</>}
        description="Taxes aren't just a once-a-year event — they're a year-round game of deadlines, deductions, and decisions. Miss a beat, and it costs you. We make sure you never do."
      />

      <section className="section bg-surface" style={{paddingTop:'40px'}}>
        <div className="container">
          <SectionHeader
            label="The Hidden Crisis No One Talks About"
            title="A missed deadline isn't a mistake.<br/><span class='accent'>It's a penalty notice.</span>"
            sub="For individuals and small-to-medium businesses alike, tax confusion and missed deadlines create cascading financial and emotional damage. Here's what's actually at stake."
          />

          <PainGroup icon={AlertTriangle} title="The Penalty of Missing Deadlines" items={deadlines}/>
          <PainGroup icon={CloudFog} title="The Fog of Not Knowing What You Owe" items={cash}/>
          <PainGroup icon={Receipt} title="The Deduction Dilemma: What Can You Actually Write Off?" items={deductions}/>

          <blockquote style={{maxWidth:'760px',margin:'0 auto',padding:'28px 32px',borderLeft:'4px solid var(--accent)',borderRadius:'0 16px 16px 0',background:'rgba(212,0,31,.04)',fontSize:'17px',lineHeight:1.7,fontStyle:'italic',color:'var(--tm)'}}>
            &ldquo;The tax code has over 70,000 pages. You shouldn&apos;t have to read a single one. That&apos;s our job — so you keep more of what you earn, on time, every time.&rdquo;
          </blockquote>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            label="What You Get"
            title="Proactive tax strategy.<br/>Not reactive panic."
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
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="content-grid">
            <RevealWrapper className="prose" delay={0.1}>
              <SectionHeader
                label="Secure Document Upload"
                title="Upload once. We handle the rest."
              />
              <p>No more email attachments, lost paperwork, or last-minute scrambles. Securely upload your tax documents anytime and we&apos;ll organize, review, and file on time — guaranteed.</p>
              <TaxUploadForm/>
            </RevealWrapper>
            <aside>
              <RevealWrapper delay={0.2}>
                <div className="sidebar-card">
                  <h4>How It Works</h4>
                  {uploadSteps.map(([Icon,t,d]) => (
                    <div key={t} style={{display:'flex',gap:'14px',marginBottom:'18px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'8px',background:'rgba(212,0,31,.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',flexShrink:0}}>
                        <Icon size={18} strokeWidth={1.8}/>
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:'15px',marginBottom:'4px'}}>{t}</div>
                        <div style={{fontSize:'14px',color:'var(--td)',lineHeight:1.5}}>{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="sidebar-cta">
                  <h4>Free Tax Review</h4>
                  <p>Let us review last year&apos;s return and show you how much you could have saved.</p>
                  <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{width:'100%',justifyContent:'center'}}>Book Free Call</a>
                </div>
              </RevealWrapper>
            </aside>
          </div>
        </div>
      </section>

      <CtaBar heading="Don't wait until the deadline." sub="Upload your documents now or schedule a free tax strategy session — and never face a tax surprise again."/>
    </>
  );
}
