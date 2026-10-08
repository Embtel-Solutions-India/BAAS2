import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevealWrapper from '../UI/RevealWrapper';
import StaggerGrid from '../UI/StaggerGrid';
import StaggerItem from '../UI/StaggerItem';
import { api, formatDate } from '../../utils/api';

// Home-page strip of the most recently published blog posts.
// Renders nothing if there are no posts or the request fails.
export default function LatestBlogs({ limit = 3 }) {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/blogs/latest?limit=${limit}`)
      .then(data => { if (!cancelled) setBlogs(data.blogs || []); })
      .catch(err => console.error('Latest blogs error:', err));
    return () => { cancelled = true; };
  }, [limit]);

  if (!blogs.length) return null;

  return (
    <section className="section bg-surface">
      <div className="container">
        <RevealWrapper>
          <div className="tc" style={{ marginBottom: '48px' }}>
            <div className="slabel">Insights &amp; News</div>
            <h2 className="stitle">Latest from our blog</h2>
          </div>
        </RevealWrapper>

        <StaggerGrid className="blog-grid">
          {blogs.map(blog => (
            <StaggerItem key={blog.id || blog.slug}>
              <Link to={`/blog/${blog.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div className="blog-card" whileHover={{ y: -6, boxShadow: '0 14px 44px rgba(0,0,0,0.1)' }}>
                  <div className="blog-thumb">
                    <span className="blog-cat">{blog.category}</span>
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div className="blog-thumb-icon">📝</div>
                    )}
                  </div>
                  <div className="blog-body">
                    <div className="blog-date">{formatDate(blog.publishedAt || blog.created_at)} &bull; {blog.readingTime || '3 min read'}</div>
                    <h3>{blog.title}</h3>
                    <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{blog.shortDescription}</p>
                    <span className="blog-link hover-arrow">
                      Read article
                      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>

        <div className="tc" style={{ marginTop: '40px' }}>
          <Link to="/blog" className="btn-pl" style={{ textDecoration: 'none' }}>View all articles</Link>
        </div>
      </div>
    </section>
  );
}
