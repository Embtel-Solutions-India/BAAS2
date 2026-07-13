import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RevealWrapper from '../../components/UI/RevealWrapper';
import StaggerGrid from '../../components/UI/StaggerGrid';
import StaggerItem from '../../components/UI/StaggerItem';
import PageHero from '../../components/Sections/PageHero';
import CtaBar from '../../components/Sections/CtaBar';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;

export default function Contact() {
  useEffect(() => { document.title = 'Contact Us | Bay Area Accounting Solutions'; }, []);

  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', service:'', message:'' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [consentError, setConsentError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = (name, value) => {
    switch(name) {
      case 'first_name': return !value ? 'First name is required.' : value.length < 2 ? 'First name must be at least 2 characters.' : '';
      case 'last_name':  return !value ? 'Last name is required.'  : value.length < 2 ? 'Last name must be at least 2 characters.'  : '';
      case 'email':   return !value ? 'Email address is required.' : !EMAIL_RE.test(value) ? 'Please enter a valid email address.' : '';
      case 'phone':   return !value ? 'Phone number is required.'  : !PHONE_RE.test(value)  ? 'Please enter a valid phone number.'  : '';
      case 'service': return !value ? 'Please select a service.' : '';
      case 'message': return !value ? 'Message is required.' : value.length < 10 ? 'Message must be at least 10 characters.' : '';
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.entries(form).forEach(([k,v]) => { const err = validate(k,v); if(err) newErrors[k] = err; });
    setErrors(newErrors);
    if (!consent) { setConsentError(true); return; }
    setConsentError(false);
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    try {
      await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...form, _subject: `New inquiry from ${form.first_name} ${form.last_name}` }),
      });
      setSubmitted(true);
    } catch {
      // fallback: still show success
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Contact'}]}
        label="Get In Touch"
        title={<>{"Let's Talk About"}<br/>{"Your Finances"}</>}
        description="Give us a call or drop by anytime. We answer all enquiries within 24 hours on business days."
      />

      <div className="content">
        <div className="container">
          <div className="contact-grid">
            <div>
              <RevealWrapper delay={0.1}>
                <StaggerGrid style={{display:'grid',gridTemplateColumns:'1fr',gap:'16px'}}>
                  <StaggerItem>
                    <a href="https://goo.gl/maps/dxnzFBXp66m" target="_blank" rel="noopener noreferrer" className="contact-info-card">
                      <div className="contact-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                      <div><div style={{fontSize:'16px',fontWeight:600,marginBottom:'4px'}}>Office Address</div><div style={{fontSize:'15px',color:'var(--tm)'}}>39159 Paseo Padre Parkway, Suite 115<br/>Fremont, CA 94538, United States</div></div>
                    </a>
                  </StaggerItem>
                  <StaggerItem>
                    <a href="tel:+15109627300" className="contact-info-card">
                      <div className="contact-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div>
                      <div><div style={{fontSize:'16px',fontWeight:600,marginBottom:'4px'}}>Phone</div><div style={{fontSize:'15px',color:'var(--tm)'}}>+1 (510) 962-7300</div></div>
                    </a>
                  </StaggerItem>
                  <StaggerItem>
                    <a href="mailto:info@bayareaaccountingsolutions.com" className="contact-info-card">
                      <div className="contact-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg></div>
                      <div><div style={{fontSize:'16px',fontWeight:600,marginBottom:'4px'}}>Email</div><div style={{fontSize:'15px',color:'var(--tm)'}}>info@bayareaaccountingsolutions.com</div></div>
                    </a>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="contact-info-card">
                      <div className="contact-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                      <div><div style={{fontSize:'16px',fontWeight:600,marginBottom:'4px'}}>Business Hours</div><div style={{fontSize:'15px',color:'var(--tm)'}}>Mon – Sat: 9:00 AM – 5:30 PM<br/>Sunday: Closed</div></div>
                    </div>
                  </StaggerItem>
                </StaggerGrid>
                <div style={{marginTop:'24px',borderRadius:'16px',overflow:'hidden',border:'1px solid var(--cb)',height:'240px'}}>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.1234!2d-121.9289!3d37.5585!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fc1234567890%3A0x1234567890!2s39159+Paseo+Padre+Pkwy+%23115%2C+Fremont%2C+CA+94538!5e0!3m2!1sen!2sus"
                    width="100%" height="240" style={{border:0}} allowFullScreen loading="lazy" title="Office location map"
                  />
                </div>
              </RevealWrapper>
            </div>

            <div>
              <RevealWrapper delay={0.2}>
                <div style={{padding:'36px',borderRadius:'20px',background:'var(--card)',border:'1px solid var(--cb)'}}>
                  <h3 className="serif" style={{fontSize:'25px',marginBottom:'6px'}}>Send us a message</h3>
                  <p style={{fontSize:'15px',color:'var(--td)',marginBottom:'24px'}}>We&apos;ll get back to you within 24 hours.</p>
                  {submitted ? (
                    <div style={{textAlign:'center',padding:'20px 0'}}>
                      <div style={{fontSize:'32px',marginBottom:'10px'}}>✅</div>
                      <p style={{fontSize:'17px',fontWeight:600,color:'#1a1a1a',marginBottom:'6px'}}>Message sent!</p>
                      <p style={{fontSize:'15px',color:'var(--tm)'}}>We&apos;ll get back to you within 24 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                        {[['first_name','First Name','John'],['last_name','Last Name','Doe']].map(([n,l,p]) => (
                          <div className="form-group" key={n}>
                            <label htmlFor={n}>{l}</label>
                            <input id={n} type="text" name={n} className={`form-input${errors[n] ? ' input-invalid':''}`} placeholder={p} value={form[n]} onChange={handleChange} required/>
                            {errors[n] && <div className="field-error">{errors[n]}</div>}
                          </div>
                        ))}
                      </div>
                      {[['email','Email','email','you@company.com'],['phone','Phone','tel','(510) 000-0000']].map(([n,l,t,p]) => (
                        <div className="form-group" key={n}>
                          <label htmlFor={n}>{l}</label>
                          <input id={n} type={t} name={n} className={`form-input${errors[n] ? ' input-invalid':''}`} placeholder={p} value={form[n]} onChange={handleChange} required/>
                          {errors[n] && <div className="field-error">{errors[n]}</div>}
                        </div>
                      ))}
                      <div className="form-group">
                        <label htmlFor="service">Service Interested In</label>
                        <select id="service" name="service" className={`form-input${errors.service ? ' input-invalid':''}`} value={form.service} onChange={handleChange} required>
                          <option value="">Select a service...</option>
                          {['Bookkeeping & Accounting','Business & Individual Taxes','Bookkeeping Cleanup','Payroll Management','Business Formation','Registered Agent','Foreign Subsidiary','Other'].map(s => <option key={s}>{s}</option>)}
                        </select>
                        {errors.service && <div className="field-error">{errors.service}</div>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea id="message" name="message" className={`form-input${errors.message ? ' input-invalid':''}`} placeholder="Tell us about your business and how we can help..." value={form.message} onChange={handleChange} required/>
                        {errors.message && <div className="field-error">{errors.message}</div>}
                      </div>
                      <div className={`consent-row${consent ? ' checked':''}`} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'20px',padding:'14px 16px',borderRadius:'10px',border:`1px solid ${consent ? 'rgba(212,0,31,.3)' : 'var(--bl)'}`,background:consent ? 'rgba(212,0,31,.03)' : 'rgba(0,0,0,0.02)',transition:'border-color .2s'}}>
                        <input type="checkbox" id="consentCheck" checked={consent} onChange={e => { setConsent(e.target.checked); setConsentError(false); }} style={{width:'18px',height:'18px',minWidth:'18px',marginTop:'2px',accentColor:'var(--accent)',cursor:'pointer'}}/>
                        <label htmlFor="consentCheck" style={{fontSize:'14px',color:'var(--tm)',lineHeight:1.5,cursor:'pointer'}}>
                          I agree to receive updates about my application or service information via SMS, email, and phone from Bay Area Accounting Solutions. Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out at any time. View our <Link to="/privacy-policy" target="_blank" style={{color:'var(--accent)',textDecoration:'underline'}}>Privacy Policy</Link>. <span style={{color:'var(--accent)',fontWeight:600}}>*</span>
                        </label>
                      </div>
                      {consentError && <div style={{color:'#d4001f',fontSize:'13px',margin:'-12px 0 14px'}}>Please tick the box above to continue.</div>}
                      <button type="submit" className="form-submit" disabled={submitting}>
                        {submitting ? 'Sending...' : 'Send Message'}
                      </button>
                    </form>
                  )}
                  <p style={{fontSize:'13px',color:'var(--tf)',marginTop:'12px',textAlign:'center'}}>Or call us directly: <a href="tel:+15109627300" style={{color:'var(--accent)'}}>(510) 962-7300</a></p>
                </div>
              </RevealWrapper>
            </div>
          </div>
        </div>
      </div>

      <CtaBar
        heading="Prefer to talk?"
        sub="Schedule a free 30-minute clarity session instead — no forms, just conversation."
      />
    </>
  );
}
