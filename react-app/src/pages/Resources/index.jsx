import { useEffect } from 'react';
import { motion } from 'framer-motion';
import RevealWrapper from '../../components/UI/RevealWrapper';
import StaggerGrid from '../../components/UI/StaggerGrid';
import StaggerItem from '../../components/UI/StaggerItem';
import FaqItem from '../../components/UI/FaqItem';
import PageHero from '../../components/Sections/PageHero';
import CtaBar from '../../components/Sections/CtaBar';

const FAQS = [
  { q: 'What records should I keep for my small business?', a: 'Keep all income and expense receipts, bank statements, payroll records, tax returns, and business contracts for at least 7 years. Digital backups are strongly recommended.' },
  { q: 'When should I switch from sole proprietor to LLC?', a: 'Consider switching when your business generates consistent income, you\'re taking on liability risk, or you want to separate personal and business finances. An LLC also provides tax flexibility.' },
  { q: 'How often should I review my financial statements?', a: 'At minimum, review monthly P&L and balance sheet reports. Cash flow projections should be reviewed weekly if you\'re in a growth phase or have tight margins.' },
  { q: 'What\'s the difference between bookkeeping and accounting?', a: 'Bookkeeping is the day-to-day recording of transactions. Accounting involves analyzing, interpreting, and reporting on that data — plus tax strategy and financial planning.' },
  { q: 'How do I know if I owe estimated quarterly taxes?', a: 'If you expect to owe more than $1,000 in federal taxes this year (after withholding), you likely need to pay quarterly estimates. Deadlines are April, June, September, and January.' },
  { q: 'What is an Enrolled Agent?', a: 'An Enrolled Agent (EA) is a federally-authorized tax practitioner who can represent taxpayers before the IRS. Our team includes EAs for comprehensive tax representation.' },
  { q: 'Can BAAS handle multi-state filings?', a: 'Yes. We handle state income tax, sales tax nexus, and compliance filings across all 50 states — especially for e-commerce businesses and companies with remote employees.' },
  { q: 'How does your client portal work?', a: 'Log in, drag and drop your documents (bank statements, receipts, tax forms), and our team receives them instantly — fully encrypted. No email attachments, no lost documents.' },
];

const GUIDES = [
  { cat: 'Tax Planning', title: 'Small Business Tax Deductions Checklist for 2025', desc: 'A comprehensive list of commonly missed deductions that could save your business thousands this tax season.', date: 'January 2025' },
  { cat: 'Bookkeeping', title: 'How to Set Up a Chart of Accounts for Your LLC', desc: 'Step-by-step guide to organizing your financial accounts from day one — saving you time and headaches at year-end.', date: 'March 2025' },
  { cat: 'Business Formation', title: 'LLC vs S-Corp: Which Entity is Right for Your Business?', desc: 'We break down the tax and liability differences between LLC and S-Corp structures to help you make the right choice.', date: 'February 2025' },
  { cat: 'Payroll', title: 'California Payroll Compliance: What Bay Area Businesses Must Know', desc: 'California has some of the strictest payroll laws in the country. This guide covers what employers must do to stay compliant.', date: 'April 2025' },
  { cat: 'Cash Flow', title: 'How to Build a 13-Week Cash Flow Forecast', desc: 'Avoid cash crunches by building a rolling 13-week forecast. Includes a free template and walk-through.', date: 'May 2025' },
  { cat: 'Tax Planning', title: 'Understanding Quarterly Estimated Tax Payments', desc: 'Who owes them, how to calculate them, and how to avoid underpayment penalties — explained in plain English.', date: 'June 2025' },
];

export default function Resources() {
  useEffect(() => { document.title = 'Resources & Guides | Bay Area Accounting Solutions'; }, []);
  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Resources'}]}
        label="Knowledge Center"
        title={<>{"Financial Clarity"}<br/>{"Starts with Knowledge"}</>}
        description="Free guides, FAQs, and expert insights to help you navigate accounting, taxes, and business finance with confidence."
      />

      <RevealWrapper>
        <section className="section">
          <div className="container">
            <div className="tc" style={{marginBottom:'48px'}}><div className="slabel">Guides & Articles</div><h2 className="stitle">Learn from our experts</h2></div>
            <StaggerGrid className="blog-grid">
              {GUIDES.map(({cat,title,desc,date}) => (
                <StaggerItem key={title}>
                  <motion.div className="blog-card" whileHover={{y:-6,boxShadow:'0 14px 44px rgba(0,0,0,0.1)'}}>
                    <div className="blog-thumb">
                      <div className="blog-cat">{cat}</div>
                      <div className="blog-thumb-icon">📄</div>
                    </div>
                    <div className="blog-body">
                      <div className="blog-date">{date}</div>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                      <span className="blog-link hover-arrow">
                        Read guide
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>
      </RevealWrapper>

      <RevealWrapper>
        <section className="section" style={{background:'rgba(212,0,31,.02)'}}>
          <div className="container">
            <div className="tc" style={{marginBottom:'48px'}}><div className="slabel">FAQ</div><h2 className="stitle">Frequently asked questions</h2></div>
            <div style={{maxWidth:'720px',margin:'0 auto'}}>
              {FAQS.map(({q,a}) => <FaqItem key={q} question={q} answer={a}/>)}
            </div>
          </div>
        </section>
      </RevealWrapper>

      <CtaBar
        heading="Have a question not answered here?"
        sub="Our team is happy to answer any accounting or tax question — for free."
      />
    </>
  );
}
