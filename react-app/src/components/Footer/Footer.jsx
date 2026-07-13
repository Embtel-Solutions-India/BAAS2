import { Link } from 'react-router-dom';
import { usePortal } from '../../hooks/usePortal';

export default function Footer() {
  const { open } = usePortal();
  return (
    <footer className="footer" id="siteFooter">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
              <div className="nav-logo-icon" style={{width:'36px',height:'36px',borderRadius:'9px',fontSize:'20px'}}>B</div>
              <span className="serif" style={{fontSize:'17px'}}>Bay Area Accounting Solutions</span>
            </div>
            <p style={{fontSize:'15px',color:'var(--td)',lineHeight:'1.7',marginBottom:'20px',maxWidth:'300px'}}>
              Full-range accounting solutions for small to mid-sized businesses. Your bookkeeper, accountant, controller, part-time CFO, and business advisor — all in one team.
            </p>
            <div className="footer-social">
              <a href="https://www.facebook.com/BAAccountingsolutions/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/bay-area-accounting-solutions/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <div className="footer-label">Services</div>
            <Link className="footer-link" to="/services/bookkeeping">Bookkeeping &amp; Accounting</Link>
            <Link className="footer-link" to="/services/tax-services">Business &amp; Individual Taxes</Link>
            <Link className="footer-link" to="/services/payroll">Payroll Management</Link>
            <Link className="footer-link" to="/services/accounting">Accounting Cleanup</Link>
            <Link className="footer-link" to="/services/consulting">Business Formation &amp; Consulting</Link>
          </div>

          <div>
            <div className="footer-label">Company</div>
            <Link className="footer-link" to="/about">About</Link>
            <Link className="footer-link" to="/services">Services</Link>
            <Link className="footer-link" to="/industries">Industries</Link>
            <Link className="footer-link" to="/resources">Resources</Link>
            <Link className="footer-link" to="/contact">Contact</Link>
            <button className="footer-link" onClick={open} style={{background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'left'}}>Client Portal</button>
          </div>

          <div>
            <div className="footer-label">Contact Us</div>
            <a href="https://goo.gl/maps/dxnzFBXp66m" target="_blank" rel="noopener noreferrer" className="footer-contact">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              39159 Paseo Padre Parkway, Suite 115, Fremont, CA 94538
            </a>
            <a href="tel:+15109627300" className="footer-contact">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              +1 (510) 962-7300
            </a>
            <a href="mailto:info@bayareaaccountingsolutions.com" className="footer-contact">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
              info@bayareaaccountingsolutions.com
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2014–2026 Bay Area Accounting Solutions. All Rights Reserved.</span>
          <span>
            <Link to="/privacy-policy">Privacy Policy</Link>
            &nbsp;&bull;&nbsp;
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            &nbsp;&bull;&nbsp;
            Designed by <a href="https://embtelsolutions.com/" target="_blank" rel="noopener noreferrer">Embtel Solutions</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
