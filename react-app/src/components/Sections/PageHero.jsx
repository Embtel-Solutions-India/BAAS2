import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

const fadeUp = { hidden:{opacity:0,y:30}, visible:{opacity:1,y:0,transition:{duration:.7,ease:[.16,1,.3,1]}} };
const stagger = { hidden:{}, visible:{transition:{staggerChildren:.08,delayChildren:.1}} };

function DefaultVisual({ title = 'Overview' }) {
  return (
    <motion.div className="page-hero-visual"
      initial={{opacity:0,x:40,scale:.96}} animate={{opacity:1,x:0,scale:1}} transition={{duration:.85,delay:.25,ease:[.16,1,.3,1]}}>
      <div className="hero-card" style={{maxWidth:340}}>
        <div className="hero-card-line" aria-hidden="true"/>
        <div className="hero-card-label">{title}</div>
        {[['Status','On Track'],['Response','Within 24h'],['Compliance','Current']].map(([k,v]) => (
          <div className="hero-card-row" key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function PageHero({ label, title, description, breadcrumb = [], visual, showCta = true }) {
  return (
    <section className="page-hero-light">
      <div className="hero-light-glow" aria-hidden="true"/>
      <div className="container" style={{position:'relative',zIndex:2}}>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="page-hero-grid">
          <div className="page-hero-copy">
            {breadcrumb.length > 0 && (
              <motion.div variants={fadeUp} className="breadcrumb" style={{marginBottom:'18px'}}>
                {breadcrumb.map((crumb, i) => (
                  <span key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span style={{color:'var(--td)'}}>{crumb.label}</span>}
                    {i < breadcrumb.length - 1 && <span style={{opacity:.4}}>›</span>}
                  </span>
                ))}
              </motion.div>
            )}
            {label && <motion.div variants={fadeUp} className="slabel">{label}</motion.div>}
            <motion.h1 variants={fadeUp} className="page-hero-title">{title}</motion.h1>
            {description && <motion.p variants={fadeUp} className="page-hero-desc">{description}</motion.p>}
            {showCta && (
              <motion.div variants={fadeUp} style={{display:'flex',gap:'14px',flexWrap:'wrap',marginTop:'28px'}}>
                <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-pl" style={{padding:'14px 28px',fontSize:'16px'}}>
                  Book Free Clarity Session
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <a href="tel:+15109627300" className="btn-ol">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  (510) 962-7300
                </a>
              </motion.div>
            )}
          </div>
          {visual !== false && (visual || <DefaultVisual title={label || 'BAAS'} />)}
        </motion.div>
      </div>
    </section>
  );
}
