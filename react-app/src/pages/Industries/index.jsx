import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevealWrapper from '../../components/UI/RevealWrapper';
import StaggerGrid from '../../components/UI/StaggerGrid';
import StaggerItem from '../../components/UI/StaggerItem';
import PageHero from '../../components/Sections/PageHero';
import CtaBar from '../../components/Sections/CtaBar';

const INDUSTRIES = [
  { name: 'Technology & SaaS', icon: '💻', desc: 'From pre-revenue startups to scaling SaaS companies — R&D credits, stock options, and investor-ready financials.' },
  { name: 'E-commerce & Retail', icon: '🛒', desc: 'Multi-platform sales reconciliation, inventory accounting, sales tax nexus compliance, and COGS tracking.' },
  { name: 'Real Estate', icon: '🏠', desc: 'Rental income tracking, depreciation schedules, 1031 exchanges, and entity structuring for investors.' },
  { name: 'Professional Services', icon: '💼', desc: 'Law firms, consultants, agencies — clean project-based financials, WIP tracking, and owner compensation strategies.' },
  { name: 'Restaurants & Food', icon: '🍴', desc: 'Complex payroll, tip reporting, cost of goods, multi-location accounting, and health inspection compliance.' },
  { name: 'Healthcare', icon: '⚕️', desc: 'Medical practices, therapists, and wellness businesses — HIPAA-compliant bookkeeping and complex billing reconciliation.' },
  { name: 'Construction', icon: '🏗️', desc: 'Job costing, progress billing, subcontractor 1099s, lien waivers, and WIP schedules for contractors.' },
  { name: 'Transportation & Logistics', icon: '🚛', desc: 'Fleet depreciation, fuel tax credits, IFTA filings, and driver payroll for trucking and logistics companies.' },
  { name: 'Creative & Media', icon: '🎨', desc: 'Freelance income tracking, project costing, royalty accounting, and self-employment tax optimization.' },
  { name: 'Education & Training', icon: '📚', desc: 'Tuition revenue, grant tracking, payroll for staff and contractors, and nonprofit compliance if applicable.' },
  { name: 'Manufacturing', icon: '🏭', desc: 'Inventory valuation, COGS tracking, depreciation of equipment, and multi-state sales tax compliance.' },
  { name: 'Non-Profit', icon: '❤️', desc: 'Fund accounting, Form 990 preparation, grant tracking, and donor reporting for mission-driven organizations.' },
];

export default function Industries() {
  useEffect(() => { document.title = 'Industries We Serve | Bay Area Accounting Solutions'; }, []);
  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Industries'}]}
        label="Who We Serve"
        title={<>{"We Speak Your"}<br/>{"Industry's Language"}</>}
        description="Whether you run a restaurant or a SaaS startup, we have deep experience in your sector — and the specific accounting challenges that come with it."
      />

      <RevealWrapper>
        <section className="section">
          <div className="container">
            <StaggerGrid style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'20px'}}>
              {INDUSTRIES.map(({name,icon,desc}) => (
                <StaggerItem key={name}>
                  <motion.div className="card" style={{height:'100%'}} whileHover={{y:-5,boxShadow:'0 12px 40px rgba(212,0,31,0.1)'}}>
                    <div style={{fontSize:'32px',marginBottom:'12px'}}>{icon}</div>
                    <h3 className="serif" style={{fontSize:'19px',marginBottom:'8px'}}>{name}</h3>
                    <p style={{fontSize:'15px',color:'var(--td)',lineHeight:1.6}}>{desc}</p>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>
      </RevealWrapper>

      <RevealWrapper>
        <section className="section" style={{paddingTop:0}}>
          <div className="container">
            <div style={{borderRadius:'20px',background:'rgba(212,0,31,.04)',border:'1px solid rgba(212,0,31,.1)',padding:'48px',textAlign:'center'}}>
              <div className="slabel" style={{textAlign:'center'}}>Don&apos;t See Your Industry?</div>
              <h2 className="stitle" style={{textAlign:'center'}}>We work with businesses of all types</h2>
              <p style={{fontSize:'17px',color:'var(--tm)',maxWidth:'560px',margin:'0 auto 28px',lineHeight:1.7}}>
                If your industry isn&apos;t listed above, don&apos;t worry — we&apos;ve worked with businesses across virtually every sector. Get in touch and we&apos;ll tell you exactly how we can help.
              </p>
              <Link to="/contact" className="btn-pl">Get In Touch</Link>
            </div>
          </div>
        </section>
      </RevealWrapper>

      <CtaBar
        heading="Ready to work with accounting specialists who understand your industry?"
        sub="Book a free clarity session tailored to your specific business type."
      />
    </>
  );
}
