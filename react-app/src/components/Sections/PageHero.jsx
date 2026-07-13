import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

const fadeUp = { hidden:{opacity:0,y:30}, visible:{opacity:1,y:0,transition:{duration:.7,ease:[.16,1,.3,1]}} };
const stagger = { hidden:{}, visible:{transition:{staggerChildren:.08,delayChildren:.1}} };

function DefaultVisual({ title = 'Overview' }) {
  return (
    <motion.div className="page-hero-visual"
      initial={{opacity:0,x:40,scale:.96}} animate={{opacity:1,x:0,scale:1}} transition={{duration:.85,delay:.25,ease:[.16,1,.3,1]}}>
      <motion.div animate={{y:[0,-12,0]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}>
        <div className="floating-card" style={{animation:'none',maxWidth:340}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
            <div style={{display:'flex',gap:'6px'}}>
              <span style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ff5f57',opacity:.7}}/>
              <span style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ffbd2e',opacity:.7}}/>
              <span style={{width:'10px',height:'10px',borderRadius:'50%',background:'#28c840',opacity:.7}}/>
            </div>
            <span style={{fontSize:'12px',color:'rgba(255,255,255,.35)',marginLeft:'auto'}}>{title}</span>
          </div>
          <div style={{padding:'16px 20px'}}>
            {['Status: On Track ✓','Response: Within 24h ✓','Compliance: Current ✓'].map((row,i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<2?'1px solid rgba(255,255,255,.06)':'none'}}>
                <span style={{fontSize:'14px',color:'rgba(255,255,255,.5)'}}>{row.split(':')[0]}</span>
                <span style={{fontSize:'14px',fontWeight:600,color:i===2?'#4ade80':'var(--accent)'}}>{row.split(':')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PageHero({ label, title, description, breadcrumb = [], visual, showCta = true }) {
  return (
    <section className="page-hero-dark">
      <div className="radial-glow" aria-hidden="true"/>
      <div className="mesh-bg" aria-hidden="true"/>
      <div className="container" style={{position:'relative',zIndex:2}}>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="page-hero-grid">
          <div className="page-hero-copy">
            {breadcrumb.length > 0 && (
              <motion.div variants={fadeUp} className="breadcrumb" style={{color:'rgba(255,255,255,.55)',marginBottom:'18px'}}>
                {breadcrumb.map((crumb, i) => (
                  <span key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    {crumb.to ? <Link to={crumb.to} style={{color:'rgba(255,255,255,.7)'}}>{crumb.label}</Link> : <span style={{color:'rgba(255,255,255,.4)'}}>{crumb.label}</span>}
                    {i < breadcrumb.length - 1 && <span style={{opacity:.4}}>›</span>}
                  </span>
                ))}
              </motion.div>
            )}
            {label && <motion.div variants={fadeUp} className="slabel" style={{color:'var(--accent3)'}}>{label}</motion.div>}
            <motion.h1 variants={fadeUp} className="page-hero-title">{title}</motion.h1>
            {description && <motion.p variants={fadeUp} className="page-hero-desc">{description}</motion.p>}
            {showCta && (
              <motion.div variants={fadeUp} style={{display:'flex',gap:'14px',flexWrap:'wrap',marginTop:'28px'}}>
                <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-pl" style={{padding:'14px 28px',fontSize:'16px'}}>
                  Book Free Clarity Session
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <a href="tel:+15109627300" className="btn-ghost" style={{color:'rgba(255,255,255,.85)',borderColor:'rgba(255,255,255,.15)'}}>
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
