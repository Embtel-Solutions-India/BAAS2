import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevealWrapper from '../../components/UI/RevealWrapper';

export default function NotFound() {
  useEffect(() => { document.title = '404 – Page Not Found | Bay Area Accounting Solutions'; }, []);
  return (
    <section className="page-hero-dark" style={{minHeight:'100vh',paddingTop:'160px'}}>
      <div className="radial-glow" aria-hidden="true"/>
      <div className="mesh-bg" aria-hidden="true"/>
      <div className="container" style={{position:'relative',zIndex:2,textAlign:'center'}}>
        <RevealWrapper>
          <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{duration:.8,ease:[.16,1,.3,1]}}
            style={{fontFamily:'DM Serif Display,serif',fontSize:'clamp(100px,18vw,180px)',lineHeight:1,color:'rgba(255,255,255,.08)',marginBottom:'-20px',userSelect:'none'}}>
            404
          </motion.div>
          <h1 className="page-hero-title" style={{marginBottom:'16px'}}>Page Not Found</h1>
          <p style={{fontSize:'18px',color:'var(--dtm)',maxWidth:'440px',margin:'0 auto 36px',lineHeight:1.7}}>
            This page doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link to="/" className="btn-pl">Back to Home</Link>
            <Link to="/contact" className="btn-ghost">Contact Us</Link>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
