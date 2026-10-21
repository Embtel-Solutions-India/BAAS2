import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, HeartPulse, Clock, GitBranch, Users, TrendingUp, EyeOff, BrainCircuit, Frown, Flame, CalendarClock, HeartCrack, Moon, Activity, UserX, BarChart3, Target, FileText, RefreshCw, CheckCircle, PieChart, ClipboardList, Calendar, User } from 'lucide-react';
import RevealWrapper from '../../../components/UI/RevealWrapper';
import PageHero from '../../../components/Sections/PageHero';
import CtaBar from '../../../components/Sections/CtaBar';
import ContactForm from '../../../components/Sections/ContactForm';
import SEOHead from '../../../components/SEO/SEOHead';
import { SITE_URL, serviceSchema, breadcrumbSchema } from '../../../components/SEO/seoConfig';

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

const BOOKKEEPING_SCHEMA = [
  serviceSchema({
    name: 'Bookkeeping & Accounting',
    description: "Monthly bookkeeping, account reconciliation, and financial reporting for Bay Area businesses.",
    path: '/services/bookkeeping',
  }),
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Bookkeeping & Accounting', path: '/services/bookkeeping' },
  ]),
];

export default function Bookkeeping() {
  const productivity = [
    [Clock,'10–15 hours per week lost','Small business owners spend an average of 10–15 hours per week on bookkeeping tasks they\'re not trained to do — reconciling bank statements, categorizing expenses, chasing receipts, fixing QuickBooks errors. That\'s nearly two full work days, every single week, spent on tasks that produce zero revenue.'],
    [GitBranch,'Decision paralysis from bad data','When your books are wrong, every decision becomes a gamble. Should you hire that new employee? Can you afford that equipment? Is this client profitable? Without accurate numbers, you either freeze or guess — and both cost you money.'],
    [Users,'Your team operates in chaos','When the owner is drowning in paperwork, the entire team feels it. Projects stall. Vendor invoices go unpaid. Employees wonder about the company\'s stability. Financial disorganization cascades into operational disorganization.'],
    [TrendingUp,'Missed revenue opportunities','While you\'re buried in spreadsheets, your competitors are closing deals, building relationships, and scaling. Every hour you spend on bookkeeping is an hour you\'re not spending on sales, strategy, or customer relationships — the things that actually grow your business.'],
    [EyeOff,'Cash flow blindness','Revenue looks good on paper, but somehow money is always tight. Without clean books, you can\'t see where cash is leaking — slow-paying clients, unnecessary subscriptions, underpriced services. You\'re generating revenue but hemorrhaging profit.'],
  ];

  const mental = [
    [BrainCircuit,'Chronic financial anxiety','The constant, low-grade dread of not knowing your real numbers. Is the IRS going to call? Did I miss a filing deadline? Am I actually making money? This anxiety doesn\'t clock out at 5 PM — it follows you home, sits with you at dinner, and wakes you up at 3 AM.'],
    [Frown,'Imposter syndrome amplified','You\'re supposed to be the boss — but you can\'t read a balance sheet. Every meeting with your accountant leaves you more confused. The jargon, the acronyms, the reports you don\'t understand. It makes you feel like a fraud in your own company.'],
    [Flame,'Burnout from wearing every hat','You started a business to do what you love — not to become a reluctant accountant. But you can\'t afford a full-time CFO, so you do it yourself, poorly, on weekends. The resentment builds. The passion fades. The burnout sets in.'],
    [CalendarClock,'Tax season PTSD','Every April becomes a crisis. Scrambling for documents, racing to file, praying you don\'t owe a fortune. Then spending the rest of the year dreading the next one. The cycle of seasonal panic never ends because the underlying problem — messy books — never gets fixed.'],
    [HeartCrack,'Relationship strain','Financial stress is the #1 cause of relationship conflict. When you\'re stressed about money, you\'re short with your partner, absent with your kids, and unavailable to the people who matter most. The business was supposed to give your family a better life — not take you away from it.'],
  ];

  const physical = [
    [Moon,'Sleep disruption','Financial uncertainty triggers cortisol, the stress hormone that disrupts sleep. You lie awake running numbers in your head. Poor sleep leads to poor decisions, which leads to more financial mistakes — a vicious cycle that degrades both health and business performance.'],
    [Activity,'Elevated blood pressure & heart risk','Chronic financial stress is linked to elevated blood pressure, cardiovascular strain, and weakened immune response. The American Psychological Association consistently ranks financial stress among the top health risk factors for adults. Your books aren\'t just numbers — they\'re a health issue.'],
    [UserX,'Neglected self-care','When you\'re working 70-hour weeks trying to keep up with everything — including accounting — the gym, healthy meals, and doctor\'s appointments are the first things to go. You skip lunch to reconcile accounts. You cancel checkups because you can\'t afford the time away.'],
  ];

  const steps = [
    ['W1','Transaction Capture','Every transaction categorized, every receipt matched, every bank feed reconciled. We capture the complete financial picture of your week — income, expenses, transfers, payments — so nothing falls through the cracks.'],
    ['W2','Reconciliation & Review','Bank statements matched to the penny. Credit cards reconciled. Anomalies flagged and investigated. We catch discrepancies before they become problems — duplicate charges, unauthorized transactions, coding errors.'],
    ['W3','Financial Reporting','Profit & Loss, Balance Sheet, Cash Flow Statement — generated, reviewed by senior accountants, and delivered to you in plain English. No jargon. No confusion. Just clear answers about how your business performed this month.'],
    ['W4','Strategy & Advisory','We don\'t just hand you reports — we explain what they mean. Where is cash leaking? Which services are most profitable? Are you on track for your quarterly goals? We translate numbers into actions.'],
  ];

  const included = [
    [FileText,'Monthly Bookkeeping','Every transaction categorized and recorded accurately, every single month.'],
    [RefreshCw,'Bank & Card Reconciliation','All accounts reconciled to the penny — bank, credit card, loans, PayPal, Stripe.'],
    [BarChart3,'Financial Statements','P&L, Balance Sheet, and Cash Flow delivered monthly in plain English.'],
    [CheckCircle,'Tax-Ready Records','Books maintained year-round for seamless tax filing — no April scramble.'],
    [Brain,'Advisory Insights','Monthly notes explaining what your numbers mean and what to do about them.'],
    [PieChart,'Custom Dashboards','Visual reports showing revenue trends, expenses, and KPIs at a glance.'],
    [ClipboardList,'Accounts Payable/Receivable','Track who owes you, who you owe, and manage aging reports.'],
    [Calendar,'Deadline Management','Sales tax, payroll tax, quarterly estimates — we track every deadline.'],
    [User,'Dedicated Bookkeeper','One person who knows your business, not a rotating pool of strangers.'],
  ];

  return (
    <>
      <SEOHead
        title="Bay Area Bookkeeping Services | Dedicated Bookkeeper | Fremont"
        description="Monthly bookkeeping for Bay Area businesses from a Fremont firm with 500+ clients: dedicated bookkeeper, bank reconciliation & financial statements. Free clarity session."
        url={`${SITE_URL}/services/bookkeeping`}
        type="website"
        structuredData={BOOKKEEPING_SCHEMA}
      />
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services',to:'/services'},{label:'Bookkeeping & Accounting'}]}
        label="Our Services"
        title={<>{'Bookkeeping &'}<br/>{'Accounting'}</>}
        description="Clear books aren't a luxury — they're the foundation of every business decision you make. Without them, you're running blind."
      />

      <section className="section bg-surface" style={{paddingTop:'40px'}}>
        <div className="container">
          <SectionHeader
            label="The Hidden Crisis No One Talks About"
            title="Messy books don't just hurt your business.<br/><span class='accent'>They hurt you.</span>"
            sub="Financial chaos doesn't stay in the spreadsheet. It bleeds into every corner of your life — your confidence, your relationships, your health, and your ability to lead."
          />

          <PainGroup icon={Zap} title="How It Destroys Productivity" items={productivity}/>
          <PainGroup icon={Brain} title="The Mental Health Toll" items={mental}/>
          <PainGroup icon={HeartPulse} title="The Physical Health Toll" items={physical}/>

          <blockquote style={{maxWidth:'760px',margin:'0 auto',padding:'28px 32px',borderLeft:'4px solid var(--accent)',borderRadius:'0 16px 16px 0',background:'rgba(212,0,31,.04)',fontSize:'17px',lineHeight:1.7,fontStyle:'italic',color:'var(--tm)'}}>
            &ldquo;You don&apos;t need to work harder. You need financial clarity — the kind that comes from clean books, honest numbers, and a partner who translates accounting into decisions.&rdquo;
          </blockquote>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeader
            label="The BAAS Monthly Bookkeeping System"
            title="Clean books every month.<br/>Clarity every day."
            sub="We don't just record transactions. We build a living financial dashboard that shows you exactly where your business stands — its real energy, its real health, and what it will take to reach your goals."
          />

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="steps-grid" style={{marginBottom:'60px'}}>
            {steps.map(([n,t,d]) => (
              <motion.div variants={fadeUp} key={n} className="step-card">
                <div className="step-bg" aria-hidden="true">{n}</div>
                <div className="step-num" style={{background:'rgba(212,0,31,.12)'}}>{n}</div>
                <h3 className="serif" style={{fontSize:'19px',marginBottom:'10px',position:'relative'}}>{t}</h3>
                <p style={{fontSize:'15px',color:'var(--td)',lineHeight:1.6,position:'relative'}}>{d}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="compare-grid" style={{marginBottom:'20px'}}>
            <div style={{padding:'36px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                <div style={{fontSize:'27px',color:'var(--accent)'}}><BarChart3 size={27} strokeWidth={1.6}/></div>
                <h3 className="serif" style={{fontSize:'22px'}}>Measure Your Business Energy</h3>
              </div>
              <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.7,marginBottom:'20px'}}>Every business generates energy — revenue momentum, cash flow velocity, profit margin trends. But without clean monthly books, you can&apos;t see it. You&apos;re driving with the dashboard lights off.</p>
              <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.7,marginBottom:'20px'}}>Our monthly reporting shows you:</p>
              <ul style={{listStyle:'none',padding:0}}>
                {['Revenue Momentum — Is your top line growing, flat, or declining? Which clients and services are driving growth?','Cash Flow Velocity — How fast is money moving through your business? Where are the bottlenecks?','Profit Margin Trends — Revenue means nothing if margins are shrinking. We track real profitability by service, client, and project.','Expense Patterns — Where is every dollar going? Are costs creeping up? What can be optimized?','Goal Distance — How far are you from the revenue, profit, or growth targets you set? What pace do you need?'].map(item => (
                  <li key={item} style={{padding:'8px 0 8px 28px',position:'relative',fontSize:'15px',color:'var(--td)',lineHeight:1.6}}>
                    <span style={{position:'absolute',left:0,top:'14px',width:'8px',height:'8px',borderRadius:'50%',background:'rgba(212,0,31,.3)',border:'2px solid var(--accent)'}}/>
                    <strong style={{color:'#1a1a1a'}}>{item.split(' — ')[0]}</strong> — {item.split(' — ')[1]}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{padding:'36px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                <div style={{fontSize:'27px',color:'var(--accent)'}}><Target size={27} strokeWidth={1.6}/></div>
                <h3 className="serif" style={{fontSize:'22px'}}>Bridge the Gap to Your Vision</h3>
              </div>
              <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.7,marginBottom:'20px'}}>You started this business with a vision. Maybe it&apos;s $1M in revenue. Maybe it&apos;s 10 employees. Maybe it&apos;s opening a second location or finally paying yourself a real salary.</p>
              <p style={{fontSize:'16px',color:'var(--tm)',lineHeight:1.7,marginBottom:'20px'}}>Clean monthly books turn vague goals into concrete numbers:</p>
              <ul style={{listStyle:'none',padding:0}}>
                {['Where you are today — Exact revenue, exact expenses, exact profit. No guessing.','Where you want to be — Translated into financial milestones with clear metrics.','What it takes to get there — Revenue needed per month, margin improvements required, expenses to cut.','Monthly progress tracking — Are you ahead of schedule or falling behind? Early warning, not year-end surprises.','Scenario planning — What happens if you hire? Raise prices? Lose a client? We model it.'].map(item => (
                  <li key={item} style={{padding:'8px 0 8px 28px',position:'relative',fontSize:'15px',color:'var(--td)',lineHeight:1.6}}>
                    <span style={{position:'absolute',left:0,top:'14px',width:'8px',height:'8px',borderRadius:'50%',background:'rgba(212,0,31,.3)',border:'2px solid var(--accent)'}}/>
                    <strong style={{color:'#1a1a1a'}}>{item.split(' — ')[0]}</strong> — {item.split(' — ')[1]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="tc" style={{marginBottom:'40px'}}>
            <h2 className="stitle" style={{fontSize:'clamp(28px,3vw,36px)'}}>Everything included in our bookkeeping service</h2>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{once:true}} className="feat-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
            {included.map(([Icon,h,p]) => (
              <motion.div variants={fadeUp} key={h} className="feat">
                <div className="feat-icon"><Icon size={25} strokeWidth={1.8}/></div>
                <h4>{h}</h4>
                <p>{p}</p>
              </motion.div>
            ))}
          </motion.div>

          <div style={{marginTop:'60px'}}>
            <h2 className="stitle" style={{fontSize:'clamp(28px,3vw,36px)',textAlign:'center'}}>We set up your accounting software — and save you money.</h2>
            <p style={{fontSize:'17px',color:'var(--tm)',lineHeight:1.7,maxWidth:'720px',margin:'20px auto 0',textAlign:'center'}}>Already using QuickBooks, Xero, or FreshBooks? We&apos;ll optimize your setup. Starting fresh? We&apos;ll get you running on the right platform from day one — and as a BAAS client, you get access to our partner discount rates on major accounting software.</p>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="content-grid">
            <RevealWrapper className="prose" delay={0.1}>
              <h2>Contact Us About Bookkeeping</h2>
              <p>Tell us about your business and how we can help. We&apos;ll get back to you within 24 hours. No obligation, no pushy sales calls.</p>
              <ContactForm source="Bookkeeping page" idPrefix="bk" />
              <p style={{fontSize:'14px',color:'var(--td)',marginTop:'16px',textAlign:'center'}}>We respond within 24 hours. No spam. No obligation.</p>
            </RevealWrapper>

            <aside>
              <RevealWrapper delay={0.2}>
                <div className="sidebar-card">
                  <h4>Other Services</h4>
                  {[['Business & Individual Taxes','/services/tax-services'],['Payroll Management','/services/payroll'],['Accounting Cleanup','/services/accounting'],['Business Formation','/services/consulting'],['Registered Agent','/services/registered-agent']].map(([l,to]) => (
                    <Link key={l} className="sidebar-link" to={to}>{l}</Link>
                  ))}
                </div>
                <div className="sidebar-cta">
                  <h4>Free Clarity Session</h4>
                  <p>30 minutes with our team. We answer your questions and recommend exactly what you need.</p>
                  <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{width:'100%',justifyContent:'center'}}>Book Free Call</a>
                </div>
              </RevealWrapper>
            </aside>
          </div>
        </div>
      </section>

      <CtaBar heading="Ready for books you can actually trust?" sub="Get a custom quote within 24 hours — no obligation."/>
    </>
  );
}
