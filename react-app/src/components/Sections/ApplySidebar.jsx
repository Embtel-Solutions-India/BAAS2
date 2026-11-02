import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, CalendarCheck, Zap, MapPin } from 'lucide-react';
import { api, formatDate } from '../../utils/api';
import { PHONE_DISPLAY, PHONE_TEL, ADDRESS } from '../../data/rush';

const DIRECTIONS_URL = 'https://share.google/txzJx1AKFhGdkltWT';
const MAP_SRC = 'https://www.google.com/maps?q=39159+Paseo+Padre+Pkwy+Suite+115,+Fremont,+CA+94538&output=embed';

// Shown until the live posts load, and kept if they cannot be loaded (also what search engines see in the prerendered page).
const FALLBACK_POSTS = [
  { slug: 'how-much-does-bookkeeping-cost-2026', title: 'How Much Does Bookkeeping Cost in 2026?', category: 'Bookkeeping' },
  { slug: 'why-every-small-business-needs-professional-accounting-services-in-2026', title: 'Why Every Small Business Needs Professional Accounting Services in 2026', category: 'Accounting' },
  { slug: '7-financial-mistakes-that-slow-down-growing-saas-companies', title: '7 Financial Mistakes That Slow Down Growing SaaS Companies', category: 'Finance' },
];

const ctaStyle = { width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '15px', textAlign: 'center' };

// Right-hand column of the /apply page: ways to reach us, the office map and recent blog posts.
export default function ApplySidebar() {
  const [posts, setPosts] = useState(FALLBACK_POSTS);

  useEffect(() => {
    let alive = true;
    api.get('/blogs?limit=3')
      .then((data) => { if (alive && Array.isArray(data.blogs) && data.blogs.length) setPosts(data.blogs.slice(0, 3)); })
      .catch(() => { /* keep the fallback links */ });
    return () => { alive = false; };
  }, []);

  return (
    <aside className="apply-aside" aria-label="Help and related reading">
      <div className="sidebar-card">
        <h4>Prefer to talk?</h4>
        <p style={{ fontSize: '15px', color: 'var(--tm)', lineHeight: 1.6, marginBottom: '16px' }}>
          Speak with our team now, or book a free 30-minute clarity session.
        </p>
        <div style={{ display: 'grid', gap: '10px' }}>
          <a href={PHONE_TEL} className="btn-p" style={ctaStyle}><Phone size={16} aria-hidden="true" />Call {PHONE_DISPLAY}</a>
          <Link to="/book" className="btn-g" style={ctaStyle}><CalendarCheck size={16} aria-hidden="true" />Book a Free Consultation</Link>
          <Link to="/rush-service" className="btn-g" style={ctaStyle}><Zap size={16} aria-hidden="true" />Need it fast? Rush Service</Link>
        </div>
      </div>

      <div className="sidebar-card" style={{ padding: 0, overflow: 'hidden' }}>
        <iframe src={MAP_SRC} width="100%" height="220" style={{ border: 0, display: 'block' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map of our Fremont office" />
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '15px', color: 'var(--tm)', lineHeight: 1.5 }}>
            <MapPin size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <span>{ADDRESS}</span>
          </div>
          <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '10px', color: 'var(--accent)', fontWeight: 600, fontSize: '15px' }}>Get directions &rarr;</a>
        </div>
      </div>

      <div className="sidebar-card">
        <h4>Related reading</h4>
        {posts.map((p) => (
          <Link key={p.slug} className="sidebar-link" to={`/blog/${p.slug}`} style={{ lineHeight: 1.4 }}>
            {p.title}
            {(p.category || p.publishedAt) && (
              <span style={{ display: 'block', fontSize: '13px', color: 'var(--tf)', marginTop: '2px' }}>
                {[p.category, p.publishedAt ? formatDate(p.publishedAt) : ''].filter(Boolean).join(' · ')}
              </span>
            )}
          </Link>
        ))}
        <Link to="/blog" style={{ display: 'inline-block', marginTop: '14px', color: 'var(--accent)', fontWeight: 600, fontSize: '15px' }}>More articles &rarr;</Link>
      </div>
    </aside>
  );
}
