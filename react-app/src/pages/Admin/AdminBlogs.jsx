import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatDate } from '../../utils/api';

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadBlogs(p = page) {
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      const data = await api.get(`/admin/blogs?${params}`);
      setBlogs(data.blogs || []);
      setPagination(data.pagination || { pages: 1 });

      // Calculate stats from all blogs (unfiltered)
      const allData = await api.get('/admin/blogs?limit=999');
      const all = allData.blogs || [];
      setStats({
        total: all.length,
        published: all.filter(b => b.status === 'published').length,
        draft: all.filter(b => b.status === 'draft').length,
        featured: all.filter(b => b.featured).length
      });
    } catch (err) {
      console.error('Load blogs error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBlogs(1); }, [search, filterStatus, filterCategory]);

  const handleTogglePublish = async (blog) => {
    try {
      if (blog.status === 'published') {
        await api.patch(`/admin/blogs/${blog.id}/unpublish`);
      } else {
        await api.patch(`/admin/blogs/${blog.id}/publish`);
      }
      loadBlogs(page);
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/blogs/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadBlogs(page);
    } catch (err) {
      console.error('Delete blog error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (p) => {
    setPage(p);
    loadBlogs(p);
  };

  return (
    <AdminLayout title="Blog Management">
      {/* Overview stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Blogs', val: stats.total, icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
          { label: 'Published', val: stats.published, icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { label: 'Drafts', val: stats.draft, icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
          { label: 'Featured', val: stats.featured, icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
        ].map(s => (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1 group relative overflow-hidden" key={s.label}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/[0.012] rounded-bl-full translate-x-3 -translate-y-3 pointer-events-none" />
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-all text-gray-500">
              {s.icon}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight font-serif mt-1">{s.val}</span>
          </div>
        ))}
      </div>

      {/* Toolbar filters search */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white"
              placeholder="Search blogs..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <select
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white cursor-pointer"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <input
              type="text"
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white"
              placeholder="Filter category..."
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            />
          </div>
          <Link 
            to="/admin/blogs/new" 
            className="inline-flex items-center justify-center px-4 py-2 bg-[#d4001f] hover:bg-[#a4001a] text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200"
          >
            + New Blog
          </Link>
        </div>
      </div>

      {/* Grid listing table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        ) : !blogs.length ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
            <h4 className="text-base font-bold text-gray-800 mb-1">No blogs found</h4>
            <p className="text-sm text-gray-400 mb-4 max-w-xs">Create your first blog post to populate this overview log dashboard.</p>
            <Link 
              to="/admin/blogs/new" 
              className="inline-flex items-center justify-center px-4 py-2 bg-[#d4001f] hover:bg-[#a4001a] text-white rounded-lg text-xs font-bold transition-all duration-200"
            >
              + Create Blog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-3.5 px-6" style={{ width: '60px' }}></th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Title</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Category</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Featured</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6" style={{ width: '120px' }}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {blogs.map(blog => (
                  <tr className="hover:bg-gray-50/40 transition-colors" key={blog.id}>
                    <td className="py-4 px-6">
                      {blog.thumbnail ? (
                        <img src={blog.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shadow-2xs shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-base shrink-0">📝</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-gray-900 leading-tight">{blog.title}</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">/{blog.slug}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-medium">{blog.category}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${blog.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleTogglePublish(blog)}
                        title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${blog.status === 'published' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100 hover:text-gray-600'}`}
                      >
                        {blog.status === 'published' ? '● Live' : '○ Off'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400">
                      {formatDate(blog.publishedAt || blog.created_at)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/blogs/${blog.id}/edit`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-[#d4001f] text-[10px] font-bold text-gray-600 hover:text-[#d4001f] transition-all bg-white"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(blog)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-[10px] font-bold text-rose-600 hover:text-rose-700 transition-all bg-white"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginator controls */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-1.5 py-4 border-t border-gray-50">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${p === page ? 'bg-[#d4001f] border-[#d4001f] text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlays Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-100">
          <div className="bg-white rounded-xl border border-gray-150 p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-extrabold text-gray-900 mb-2">Delete Blog</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

