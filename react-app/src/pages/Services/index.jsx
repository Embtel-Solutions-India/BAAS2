import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevealWrapper from '../../components/UI/RevealWrapper';
import StaggerGrid from '../../components/UI/StaggerGrid';
import StaggerItem from '../../components/UI/StaggerItem';
import PageHero from '../../components/Sections/PageHero';
import CtaBar from '../../components/Sections/CtaBar';

const SERVICES = [
  { icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>, title: 'Bookkeeping & Accounting', desc: 'Crystal-clear books, monthly reports that actually make sense, and year-end confidence. We reconcile accounts, categorize transactions, and deliver clean financial statements every month.', href: '/services/bookkeeping', features: ['Monthly reconciliation','P&L statements','Balance sheet','Year-end prep'] },
  { icon: <><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>, title: 'Business & Individual Taxes', desc: 'Proactive tax strategy that saves you thousands — not reactive filing that costs you penalties. We handle business and personal returns with full IRS representation if needed.', href: '/services/tax-services', features: ['Business tax returns','Personal returns','IRS representation','Tax planning'] },
  { icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>, title: 'Payroll Management', desc: 'Employees paid correctly and on time. Compliance handled. Direct deposits done. We manage your entire payroll process including tax filings and year-end W-2s.', href: '/services/payroll', features: ['Direct deposit','Tax filings','W-2 & 1099 prep','Compliance management'] },
  { icon: <><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></>, title: 'Business Formation & Consulting', desc: 'LLC, S-Corp, C-Corp — set up correctly from day one with EIN and state filings. We guide you through entity selection, operating agreements, and ongoing compliance.', href: '/services/consulting', features: ['Entity formation','EIN registration','Operating agreements','Compliance setup'] },
  { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></>, title: 'Accounting Cleanup', desc: 'Months or years of disorganized books? We specialize in rescue bookkeeping — catching up on back-records, reconciling accounts, and restoring financial clarity.', href: '/services/accounting', features: ['Back-record catch-up','Account reconciliation','Error correction','Clean handoff'] },
  { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, title: 'Registered Agent Services', desc: 'Stay compliant in California and every state you operate in. We serve as your registered agent, handling all state correspondence and legal notices on your behalf.', href: '/services/registered-agent', features: ['State compliance','Legal notice handling','Annual reports','Multi-state support'] },
  { icon: <><path d="M3 3h18v4H3z"/><path d="M3 9h18v4H3z"/><path d="M3 15h12v4H3z"/><path d="M17 17l2 2 4-4"/></>, title: 'Bookkeeping Cleanup & Catch-Up', desc: 'Months or years behind on your books? We fix messy QuickBooks, reconcile every account, clear uncategorized transactions, and get you audit-ready — fast. AI-assisted, human-verified.', href: '/services/bookkeeping-cleanup', features: ['QuickBooks cleanup','Catch-up bookkeeping','Bank reconciliation','Audit-ready financials'] },
];

export default function Services() {
  useEffect(() => { document.title = 'Services | Bay Area Accounting Solutions'; }, []);
  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Services'}]}
        label="What We Do"
        title={<>{"Full-Range Financial"}<br/>{"Services for Your Business"}</>}
        description="One team that handles everything from bookkeeping to business formation — so you can focus on growth."
      />

      <RevealWrapper>
        <section className="section">
          <div className="container">
            <StaggerGrid style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'24px'}}>
              {SERVICES.map(({icon,title,desc,href,features}) => (
                <StaggerItem key={title}>
                  <motion.div className="card-lg" style={{display:'flex',flexDirection:'column',height:'100%'}}
                    whileHover={{y:-6,boxShadow:'0 12px 40px rgba(212,0,31,0.12)'}}>
                  <div style={{fontSize:'31px',marginBottom:'16px',color:'var(--accent)'}}>
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-.14em'}} aria-hidden="true">{icon}</svg>
                  </div>
                  <h3 className="serif" style={{fontSize:'21px',marginBottom:'10px'}}>{title}</h3>
                  <p style={{fontSize:'15px',color:'var(--td)',lineHeight:1.6,marginBottom:'16px',flex:1}}>{desc}</p>
                  <ul style={{listStyle:'none',padding:0,marginBottom:'20px'}}>
                    {features.map(f => (
                      <li key={f} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'14px',color:'var(--tm)',marginBottom:'6px'}}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10l4 4 8-8" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={href} className="hover-arrow" style={{fontSize:'15px',color:'var(--accent)',fontWeight:500,display:'inline-flex',alignItems:'center',gap:'6px',marginTop:'auto'}}>
                    Learn more
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>
      </RevealWrapper>

      <CtaBar
        heading="Not sure which service you need?"
        sub="Book a free clarity session and we'll recommend the exact package for your business."
      />
    </>
  );
}
