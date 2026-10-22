import { useEffect } from 'react';
import SEOHead from '../../components/SEO/SEOHead';
import { SITE_URL, breadcrumbSchema } from '../../components/SEO/seoConfig';
import { BOOKING_EMBED_URL } from '../../data/booking';

const SCHEMA = breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Book a Free Consultation', path: '/book' }]);

// On-site booking page: the calendar is embedded so bookings start (and can be measured) on our own domain.
export default function Book() {
  useEffect(() => {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', 'view_booking_page', { referrer: document.referrer || 'direct' });
    } catch { /* analytics must never break the page */ }
  }, []);

  return (
    <>
      <SEOHead
        title="Book a Free Consultation | Bay Area Accounting Solutions"
        description="Pick a time for a free 30-minute clarity session with Bay Area Accounting Solutions. We answer your questions and recommend exactly what you need."
        url={`${SITE_URL}/book`}
        type="website"
        structuredData={SCHEMA}
      />
      <section className="section" style={{ paddingTop: 'clamp(120px,12vw,160px)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="tc" style={{ marginBottom: '32px' }}>
            <div className="slabel">Free clarity session</div>
            <h1 className="stitle">Book a free consultation</h1>
            <p className="ssub">Choose a time that works for you. The calendar shows times in your own time zone, and there is no obligation.</p>
          </div>
          <div style={{ border: '1px solid var(--cb)', borderRadius: '20px', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04)' }}>
            <iframe title="Book a free consultation" src={BOOKING_EMBED_URL} className="book-frame" />
          </div>
          <p className="tc" style={{ marginTop: '18px', fontSize: '14px', color: 'var(--td)' }}>
            Calendar not loading?{' '}
            <a href={BOOKING_EMBED_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Open it in a new tab</a>
            {' '}or call <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>.
          </p>
          <noscript><p className="tc"><a href={BOOKING_EMBED_URL}>Open the booking calendar</a></p></noscript>
        </div>
      </section>
    </>
  );
}
