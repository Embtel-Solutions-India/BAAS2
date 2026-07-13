import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevealWrapper from '../../components/UI/RevealWrapper';
import StaggerGrid from '../../components/UI/StaggerGrid';
import StaggerItem from '../../components/UI/StaggerItem';
import CtaBar from '../../components/Sections/CtaBar';
import SEOHead from '../../components/SEO/SEOHead';
import { api, formatDate } from '../../utils/api';

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    async function fetchBlogDetail() {
      setLoading(true);
      setError('');
      setImgError(false);
      try {
        const data = await api.get(`/blogs/${slug}`);
        setBlog(data.blog);
        setRelated(data.related || []);
      } catch (err) {
        console.error('Fetch blog detail error:', err);
        setError(err.message || 'Article not found');
      } finally {
        setLoading(false);
      }
    }
    fetchBlogDetail();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(212,0,31,.2)', borderTopColor: '#d4001f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', marginBottom: '16px' }}>Article Not Found</h2>
        <p style={{ color: 'var(--td)', marginBottom: '24px' }}>The article you are looking for does not exist or has been removed.</p>
        <Link to="/blog" className="btn-pl" style={{ textDecoration: 'none' }}>Back to Blog</Link>
      </div>
    );
  }

  const currentUrl = window.location.href;

  return (
    <>
      <SEOHead
        title={`${blog.metaTitle || blog.title} | Bay Area Accounting Solutions`}
        description={blog.metaDescription || blog.shortDescription}
        image={blog.thumbnail}
        url={currentUrl}
        author={blog.author}
        publishedTime={blog.publishedAt || blog.created_at}
        tags={blog.tags}
      />

      <article className="blog-detail-container" style={{ padding: '80px 0 40px' }}>
        <div className="blog-detail-wrap">
          {/* Back button */}
          <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, fontSize: '15px', marginBottom: '32px', transition: 'transform .2s' }} className="hover-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(180deg)' }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Back to Insights
          </Link>

          {/* Header */}
          <header style={{ marginBottom: '36px' }}>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', background: 'rgba(212,0,31,.1)', color: 'var(--accent)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '16px' }}>
              {blog.category}
            </span>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4.5vw, 42px)', lineHeight: 1.2, marginBottom: '20px', color: '#111', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {blog.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '15px', color: 'var(--td)', borderBottom: '1px solid var(--cb)', paddingBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                  {blog.author[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--tm)' }}>{blog.author}</span>
              </div>
              <span>•</span>
              <span>{formatDate(blog.publishedAt || blog.created_at)}</span>
              <span>•</span>
              <span>{blog.readingTime || '3 min read'}</span>
            </div>
          </header>

          {/* Featured Image or Placeholder */}
          {blog.thumbnail && !imgError ? (
            <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', marginBottom: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', height: 'clamp(220px, 35vw, 420px)' }}>
              <img 
                src={blog.thumbnail} 
                alt={blog.title} 
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} 
                loading="lazy" 
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div style={{ width: '100%', borderRadius: '20px', marginBottom: '40px', height: '180px', background: 'linear-gradient(135deg, rgba(212,0,31,0.04), rgba(164,0,26,0.02))', border: '1px solid var(--cb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '40px', opacity: 0.15 }}>📝</span>
              <span style={{ fontSize: '13px', color: 'var(--td)', fontWeight: 500 }}>Bay Area Insights</span>
            </div>
          )}

          {/* Article Rich Text Content */}
          <RevealWrapper>
            <div
              className="blog-rich-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </RevealWrapper>

          {/* Share Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--cb)', borderBottom: '1px solid var(--cb)', padding: '20px 0', margin: '40px 0', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '14px', color: 'var(--td)', fontWeight: 600 }}>
              Share this insight:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Twitter', icon: <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(currentUrl)}` },
                { label: 'LinkedIn', icon: <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>, url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(blog.title)}` },
                { label: 'Copy Link', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>, action: 'copy' }
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => {
                    if (s.action === 'copy') {
                      navigator.clipboard.writeText(currentUrl);
                      alert('Link copied to clipboard!');
                    } else {
                      window.open(s.url, '_blank', 'width=600,height=400');
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--bl)', background: '#fff', cursor: 'pointer', gap: '6px', fontSize: '13px', color: 'var(--tm)', fontWeight: 500, transition: 'all .2s' }}
                  className="share-btn"
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
              {blog.tags.map(t => (
                <span key={t} style={{ padding: '6px 12px', borderRadius: '100px', background: '#f3f4f6', color: 'var(--td)', fontSize: '13px', fontWeight: 500 }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Related Blogs */}
      {related.length > 0 && (
        <section className="section" style={{ background: '#fafafa', borderTop: '1px solid var(--cb)', borderBottom: '1px solid var(--cb)' }}>
          <div className="container">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', marginBottom: '40px', textAlign: 'center' }}>Related Insights</h2>
            <StaggerGrid className="blog-grid">
              {related.map(item => (
                <StaggerItem key={item.title}>
                  <Link to={`/blog/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <motion.div className="blog-card" whileHover={{ y: -6, boxShadow: '0 14px 44px rgba(0,0,0,0.1)' }}>
                      <div className="blog-thumb">
                        <span className="blog-cat">{item.category}</span>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        ) : (
                          <div className="blog-thumb-icon">📝</div>
                        )}
                      </div>
                      <div className="blog-body">
                        <div className="blog-date">{formatDate(item.publishedAt || item.created_at)} &bull; {item.readingTime || '3 min read'}</div>
                        <h3 style={{ fontSize: '20px', lineHeight: 1.3 }}>{item.title}</h3>
                        <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.shortDescription}</p>
                        <span className="blog-link hover-arrow">
                          Read article
                          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>
      )}

      <CtaBar
        heading="Want advice specific to your situation?"
        sub="Book a free 30-minute call and get answers tailored to your business — not generic tips."
      />
    </>
  );
}
