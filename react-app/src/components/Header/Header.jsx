import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePortal } from '../../hooks/usePortal';

const BOOK = 'https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt';

const services = [
  ['Bookkeeping & Accounting',      '/services/bookkeeping'],
  ['Business & Individual Taxes',   '/services/tax-services'],
  ['Payroll Management',            '/services/payroll'],
  ['Accounting Cleanup',            '/services/accounting'],
  ['Business Formation & Consulting','/services/consulting'],
  ['Registered Agent',              '/services/registered-agent'],
];

const beforeServices = [
  ['Home',  '/'],
  ['About', '/about'],
];
const afterServices = [
  ['Industries', '/industries'],
  ['Blog',       '/blog'],
  ['Contact',    '/contact'],
];

export default function Header() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { open } = usePortal();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setMobileOpen(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // All page heroes now use a light background, so the nav always renders dark
  // text (the white-on-dark `nav-hero` treatment is no longer needed).
  const navClass = `nav ${scrolled ? 'scrolled' : ''}`;

  return (
    <nav className={navClass} id="mainNav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" aria-label="Bay Area Accounting Solutions – Home">
          <div className="nav-logo-icon" aria-hidden="true">B</div>
          <div>
            <div className="nav-logo-text">Bay Area Accounting</div>
            <div className="nav-logo-sub">Solutions</div>
          </div>
        </Link>

        <div className="nav-links" role="menubar">
          {beforeServices.map(([label, path]) => (
            <Link key={path} to={path} role="menuitem" className={`nav-link ${isActive(path)}`}>
              {label}
            </Link>
          ))}

          <div className="dropdown"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
            role="none"
          >
            <button className="nav-link" aria-haspopup="true" aria-expanded={servicesOpen}>
              Services
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{transform:servicesOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="dropdown-menu" style={{display:servicesOpen?'block':'none'}} role="menu">
              <div className="dropdown-inner">
                {services.map(([label, path]) => (
                  <Link className="dropdown-item" to={path} role="menuitem" key={path}>{label}</Link>
                ))}
                <div style={{borderTop:'1px solid var(--border)',marginTop:'6px',paddingTop:'6px'}}>
                  <Link className="dropdown-item" to="/services" role="menuitem" style={{color:'var(--accent)'}}>View all services</Link>
                </div>
              </div>
            </div>
          </div>

          {afterServices.map(([label, path]) => (
            <Link key={path} to={path} role="menuitem" className={`nav-link ${isActive(path)}`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="nav-cta">
          <button className="btn-g" onClick={open} aria-label="Open client portal login">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Client Login
          </button>
          <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p">Free Consultation</a>
        </div>

        <button
          className="mob-toggle"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {mobileOpen ? <path d="M6 6l12 12M18 6L6 18"/> : <path d="M3 6h18M3 12h18M3 18h18"/>}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="mob-menu open" id="mobMenu" role="menu">
          <Link className="mob-link" to="/" onClick={close} role="menuitem">Home</Link>
          <Link className="mob-link" to="/about" onClick={close} role="menuitem">About</Link>
          <div className="mob-sub-label">Services</div>
          {services.map(([label, path]) => (
            <Link className="mob-sub-link" to={path} onClick={close} role="menuitem" key={path}>{label}</Link>
          ))}
          <Link className="mob-sub-link" to="/services" onClick={close} role="menuitem">View all services</Link>
          <Link className="mob-link" to="/industries" onClick={close} role="menuitem">Industries</Link>
          <Link className="mob-link" to="/blog" onClick={close} role="menuitem">Blog</Link>
          <Link className="mob-link" to="/contact" onClick={close} role="menuitem">Contact</Link>
          <div style={{marginTop:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
            <button className="btn-g" style={{justifyContent:'center',padding:'12px'}} onClick={() => { close(); open(); }}>Client Login</button>
            <a href={BOOK} target="_blank" rel="noopener noreferrer" className="btn-p" style={{justifyContent:'center',padding:'12px'}} onClick={close}>Free Consultation</a>
          </div>
        </div>
      )}
    </nav>
  );
}
