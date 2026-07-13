import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevealWrapper from '../../components/UI/RevealWrapper';
import StaggerGrid from '../../components/UI/StaggerGrid';
import StaggerItem from '../../components/UI/StaggerItem';
import PageHero from '../../components/Sections/PageHero';
import CtaBar from '../../components/Sections/CtaBar';
import { api, formatDate } from '../../utils/api';

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });

  async function loadPublishedBlogs(p = page, cat = activeCategory) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 9 });
      if (cat !== 'All') params.set('category', cat);
      if (search) params.set('search', search);

      const data = await api.get(`/blogs?${params}`);
      setBlogs(data.blogs || []);
      setPagination(data.pagination || { pages: 1 });

      if (data.categories) {
        setCategories(['All', ...data.categories]);
      }
    } catch (err) {
      console.error('Error loading published blogs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Blog | Bay Area Accounting Solutions';
    loadPublishedBlogs(1, activeCategory);
  }, [activeCategory, search]);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    loadPublishedBlogs(p, activeCategory);
  };

  return (
    <>
      <PageHero
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Blog' }]}
        label="Insights & News"
        title={<>{"Financial Insights for"}<br />{"Bay Area Business Owners"}</>}
        description="Practical accounting, tax, and business finance advice — written for entrepreneurs, not accountants."
      />

      <RevealWrapper>
        <section className="section" style={{ paddingBottom: '80px' }}>
          <div className="container">
            {/* Search & Category Filter Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '100px',
                      border: '1px solid var(--cb)',
                      background: cat === activeCategory ? 'var(--accent)' : 'transparent',
                      color: cat === activeCategory ? '#fff' : 'var(--tm)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all .2s',
                      fontFamily: 'DM Sans,sans-serif'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="admin-search"
                style={{
                  width: '280px',
                  padding: '10px 16px',
                  borderRadius: '100px',
                  border: '1px solid var(--bl)',
                  background: '#f9f9fb',
                  fontSize: '14px'
                }}
                placeholder="Search articles..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ borderRadius: '20px', border: '1px solid var(--cb)', overflow: 'hidden', background: '#fff' }}>
                    <div style={{ height: '200px', background: '#f5f5f7', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ padding: '24px' }}>
                      <div style={{ width: '40%', height: '14px', background: '#f5f5f7', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ width: '80%', height: '22px', background: '#f5f5f7', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ width: '95%', height: '14px', background: '#f5f5f7', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ width: '90%', height: '14px', background: '#f5f5f7', animation: 'pulse 1.5s infinite' }} />
                    </div>
                  </div>
                ))}
                <style>{`@keyframes pulse{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}`}</style>
              </div>
            ) : !blogs.length ? (
              <div className="empty-state" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', marginBottom: '12px' }}>No Articles Found</h3>
                <p style={{ color: 'var(--td)', fontSize: '15px' }}>Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <>
                <StaggerGrid className="blog-grid">
                  {blogs.map(blog => (
                    <StaggerItem key={blog.id}>
                      <Link to={`/blog/${blog.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <motion.div className="blog-card" whileHover={{ y: -6, boxShadow: '0 14px 44px rgba(0,0,0,0.1)' }}>
                          <div className="blog-thumb">
                            <span className="blog-cat">{blog.category}</span>
                            {blog.thumbnail ? (
                              <img
                                src={blog.thumbnail}
                                alt={blog.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />
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

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: '1px solid var(--bl)',
                          background: p === page ? 'var(--accent)' : '#fff',
                          color: p === page ? '#fff' : 'var(--tm)',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          transition: 'all .2s'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </RevealWrapper>

      <CtaBar
        heading="Want advice specific to your situation?"
        sub="Book a free 30-minute call and get answers tailored to your business — not generic tips."
      />
    </>
  );
}
