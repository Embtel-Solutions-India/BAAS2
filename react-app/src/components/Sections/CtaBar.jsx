import { motion } from 'framer-motion';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

export default function CtaBar({ heading, sub, showPhone = true }) {
  const headingStyle = { maxWidth: '700px', margin: '0 auto 20px' };
  const renderHeading = () => {
    if (heading.includes('<')) {
      return <h2 style={headingStyle} dangerouslySetInnerHTML={{ __html: heading }} />;
    }
    return <h2 style={headingStyle}>{heading}</h2>;
  };

  return (
    <section className="cta-dark">
      <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(212,0,31,.25),transparent)'}} aria-hidden="true"/>
      <div className="mesh-bg" aria-hidden="true"/>

      <motion.div
        initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-80px'}}
        transition={{duration:.7,ease:[.16,1,.3,1]}}
        className="container" style={{position:'relative',zIndex:2}}
      >
        <div className="pill" style={{textTransform:'uppercase',letterSpacing:'.16em',fontSize:'12px',marginBottom:'24px'}}>
          Take the next step
        </div>
        {renderHeading()}
        {sub && <p>{sub}</p>}
        <div className="cta-buttons">
          <motion.a href={BOOK} target="_blank" rel="noopener noreferrer"
            whileHover={{scale:1.04}} whileTap={{scale:.97}} className="btn-pl">
            Book Your Free Clarity Session
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.a>
          {showPhone && (
            <motion.a href="tel:+15109627300"
              whileHover={{scale:1.03}} whileTap={{scale:.97}} className="btn-ghost">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              (510) 962-7300
            </motion.a>
          )}
        </div>
      </motion.div>
    </section>
  );
}
