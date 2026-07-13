import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import RevealWrapper from '../../components/UI/RevealWrapper';
import StaggerGrid from '../../components/UI/StaggerGrid';
import StaggerItem from '../../components/UI/StaggerItem';
import PageHero from '../../components/Sections/PageHero';
import CtaBar from '../../components/Sections/CtaBar';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

export default function About() {
  useEffect(() => { document.title = 'About Us | Bay Area Accounting Solutions'; }, []);
  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'About'}]}
        label="About Us"
        title={<>{"The Team Behind"}<br/>{"Your Financial Clarity"}</>}
        description="We're not just accountants. We're business owners who understand what it means to lose sleep over numbers — and we built BAAS to make sure you never have to."
      />

      <div className="content">
        <div className="container">
          <div className="content-grid">
            <RevealWrapper className="prose" delay={0.1}>
              <h2>Our Story</h2>
              <p>Bay Area Accounting Solutions was founded with a simple observation: most small and medium-sized business owners are incredibly talented at what they do — building products, serving customers, creating value — but they&apos;re flying blind when it comes to their finances.</p>
              <p>This financial obscurity doesn&apos;t just hurt the business. It causes real stress. It affects sleep, relationships, health, and the ability to make confident decisions. We&apos;ve seen brilliant entrepreneurs make costly mistakes simply because they didn&apos;t have clear, timely financial information.</p>
              <p>We exist to change that. BAAS is your full-range accounting partner: bookkeeper, accountant, controller, part-time CFO, and business advisor — all in one team. We don&apos;t just process transactions. We translate your numbers into clarity, confidence, and growth.</p>

              <h2>What Sets Us Apart</h2>
              <p>Unlike traditional accounting firms that speak in jargon and disappear after tax season, we provide year-round, proactive support. We&apos;re based in Fremont, CA, but serve clients across all 50 states through our secure client portal.</p>

              <h3>Enrolled Agent Expertise</h3>
              <p>Our team includes Enrolled Agents — tax professionals who have earned the privilege of representing taxpayers before the Internal Revenue Service. This means when the IRS comes calling, we don&apos;t just prepare your taxes — we stand beside you.</p>

              <h2>Our Mission</h2>
              <p>To give every small and medium-sized business owner the financial clarity they need to grow their business, protect their livelihood, and reclaim their peace of mind. We handle the business essentials so you can focus on expansion.</p>

              <StaggerGrid className="feat-grid">
                {[
                  [<><circle key="a" cx="12" cy="12" r="9"/><circle key="b" cx="12" cy="12" r="5"/><circle key="c" cx="12" cy="12" r="1.4" fill="currentColor"/></>,'500+ Businesses','Served across all 50 states since 2014'],
                  [<><line key="a" x1="12" y1="2" x2="12" y2="22"/><path key="b" d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,'$12M+ Saved','In total tax savings for our clients'],
                  [<><path key="a" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle key="b" cx="9" cy="7" r="4"/><path key="c" d="M23 21v-2a4 4 0 0 0-3-3.87"/><path key="d" d="M16 3.13a4 4 0 0 1 0 7.75"/></>,'98% Retention','Because results speak louder than promises'],
                ].map(([svg,h,p]) => (
                  <StaggerItem key={h} className="feat">
                    <div className="feat-icon"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-.14em'}} aria-hidden="true">{svg}</svg></div>
                    <h4>{h}</h4><p>{p}</p>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </RevealWrapper>

            <aside>
              <RevealWrapper delay={0.2}>
                <div className="sidebar-card">
                <h4>Our Services</h4>
                {[['Bookkeeping & Accounting','/services/bookkeeping'],['Business & Individual Taxes','/services/tax-services'],['Bookkeeping Cleanup','/services/accounting'],['Payroll Management','/services/payroll'],['Business Formation','/services/consulting'],['Registered Agent','/services'],['Foreign Subsidiary','/services']].map(([label,to]) => (
                  <Link key={label} className="sidebar-link" to={to}>{label}</Link>
                ))}
              </div>
              <div className="sidebar-cta">
                <h4>Need Help?</h4>
                <p>Schedule a free 30-minute clarity session with our team. No obligation.</p>
                <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{width:'100%',justifyContent:'center'}}>Book Free Call</a>
              </div>
              </RevealWrapper>
              <RevealWrapper delay={0.3}>
              <div className="sidebar-card" style={{marginTop:'20px'}}>
                <h4>Contact</h4>
                <div style={{fontSize:'15px',color:'var(--tm)',marginBottom:'8px'}}>
                  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-.14em'}} aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {' '}39159 Paseo Padre Pkwy, Ste 115, Fremont, CA 94538
                </div>
                <div style={{fontSize:'15px',color:'var(--tm)',marginBottom:'8px'}}>
                  <a href="tel:+15109627300" style={{color:'var(--accent)'}}>(510) 962-7300</a>
                </div>
                <div style={{fontSize:'15px',color:'var(--tm)'}}>
                  <a href="mailto:info@bayareaaccountingsolutions.com" style={{color:'var(--accent)',wordBreak:'break-all'}}>info@bayareaaccountingsolutions.com</a>
                </div>
              </div>
              </RevealWrapper>
            </aside>
          </div>
        </div>
      </div>

      {/* ═══ GOOGLE REVIEWS ═══════════════════════════════════════════ */}
      <section className="section bg-white" style={{paddingTop:'40px'}}>
        <div className="container">
          <RevealWrapper className="tc" style={{marginBottom:'40px'}}>
            <div className="slabel">Reviewed by Clients</div>
            <h2 className="stitle">What our clients say on Google</h2>
          </RevealWrapper>
          <div className="elfsight-app-a13c0b30-2d99-4de3-8204-0b55392cb077" data-elfsight-app-lazy/>
        </div>
      </section>

      <CtaBar
        heading="Ready to experience the difference?"
        sub="Schedule a free clarity session and discover what financial peace of mind feels like."
      />
    </>
  );
}
