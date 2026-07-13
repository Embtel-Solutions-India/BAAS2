import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatDate } from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_clients: 0,
    total_orders: 0,
    pending_orders: 0,
    revenue: 0,
    total_blogs: 0,
    published_blogs: 0,
    draft_blogs: 0,
    total_users: 0,
    recent_activities: [],
    recent_blogs: [],
    blog_stats: [],
    user_growth: [],
    monthly_activity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const statsData = await api.get('/admin/stats');
        setStats(statsData);
      } catch (err) {
        console.error('Error loading admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Calculate highest value for chart scaling
  const maxCategoryCount = Math.max(...(stats.blog_stats || []).map(b => b.count), 1);
  const maxGrowthCount = Math.max(...(stats.user_growth || []).map(u => u.count), 1);
  const maxActivityCount = Math.max(...(stats.monthly_activity || []).map(a => a.count), 1);

  return (
    <AdminLayout title="Dashboard">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {/* Total Clients */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/[0.015] rounded-bl-full translate-x-3 -translate-y-3 pointer-events-none" />
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-all text-gray-500">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Clients</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight font-serif mt-1">{stats.total_clients}</span>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/[0.015] rounded-bl-full translate-x-3 -translate-y-3 pointer-events-none" />
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-all text-gray-500">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Users</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight font-serif mt-1">{stats.total_users}</span>
        </div>

        {/* Total Blogs */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/[0.015] rounded-bl-full translate-x-3 -translate-y-3 pointer-events-none" />
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-all text-gray-500">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Blogs</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight font-serif mt-1">{stats.total_blogs}</span>
        </div>

        {/* Published Blogs */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/[0.015] rounded-bl-full translate-x-3 -translate-y-3 pointer-events-none" />
          <div className="w-9 h-9 rounded-lg bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-center mb-2 group-hover:scale-105 transition-all text-emerald-600">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Published</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight font-serif mt-1">{stats.published_blogs}</span>
        </div>

        {/* Draft Blogs */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/[0.015] rounded-bl-full translate-x-3 -translate-y-3 pointer-events-none" />
          <div className="w-9 h-9 rounded-lg bg-amber-50/50 border border-amber-100/50 flex items-center justify-center mb-2 group-hover:scale-105 transition-all text-amber-600">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drafts</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight font-serif mt-1">{stats.draft_blogs}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Growth */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs flex flex-col">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 pb-3 border-b border-gray-50">User Growth</h3>
          {!stats.user_growth.length ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-12">No growth data available.</div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {stats.user_growth.map(ug => (
                <div key={ug.month} className="flex items-center gap-3">
                  <div className="w-14 shrink-0 text-xs font-semibold text-gray-500">{ug.month}</div>
                  <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#d4001f] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(ug.count / maxGrowthCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-right text-xs font-bold text-gray-800">{ug.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs flex flex-col">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 pb-3 border-b border-gray-50">Monthly Activity</h3>
          {!stats.monthly_activity.length ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-12">No activity data available.</div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {stats.monthly_activity.map(ma => (
                <div key={ma.month} className="flex items-center gap-3">
                  <div className="w-14 shrink-0 text-xs font-semibold text-gray-500">{ma.month}</div>
                  <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#d4001f] to-[#a4001a] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(ma.count / maxActivityCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-right text-xs font-bold text-gray-800">{ma.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blogs by Category */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs flex flex-col">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 pb-3 border-b border-gray-50">Blogs by Category</h3>
          {!stats.blog_stats.length ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-12">No category data available.</div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {stats.blog_stats.map(bs => (
                <div key={bs.category} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-xs font-semibold text-gray-500 truncate" title={bs.category}>{bs.category}</div>
                  <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(bs.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-right text-xs font-bold text-gray-800">{bs.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Second Row: Recent Blogs & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Blogs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recent Blogs</h3>
            <Link 
              to="/admin/blogs" 
              className="text-xs font-semibold text-[#d4001f] hover:text-[#a4001a] hover:underline transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="p-6 flex-1 space-y-4">
            {!stats.recent_blogs.length ? (
              <div className="flex items-center justify-center text-xs text-gray-400 py-12">No blogs created yet.</div>
            ) : (
              <div className="space-y-4">
                {stats.recent_blogs.map(b => (
                  <div key={b.id} className="flex gap-4 items-center pb-4 last:pb-0 border-b border-gray-50 last:border-b-0">
                    {b.thumbnail ? (
                      <img src={b.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100 shadow-2xs shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-lg border border-gray-100 shrink-0">📝</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">{b.title}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <span>{b.category}</span>
                        <span>&bull;</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recent Activities</h3>
            <Link 
              to="/admin/activity" 
              className="text-xs font-semibold text-[#d4001f] hover:text-[#a4001a] hover:underline transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="p-6 flex-1">
            {!stats.recent_activities.length ? (
              <div className="flex items-center justify-center text-xs text-gray-400 py-12">No activity logs found.</div>
            ) : (
              <div className="space-y-4 max-h-[310px] overflow-y-auto pr-1">
                {stats.recent_activities.map(act => (
                  <div key={act.id} className="text-xs pb-4 last:pb-0 border-b border-gray-50 last:border-b-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-gray-800">{act.admin_name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{formatDate(act.created_at)}</span>
                    </div>
                    <div className="text-gray-500 leading-relaxed">
                      Performed action: <code className="bg-gray-50 text-gray-800 px-1.5 py-0.5 rounded-md border border-gray-100 text-[11px] font-mono">{act.action}</code> on <span className="font-semibold text-gray-700">{act.entity_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link 
            to="/admin/blogs/new" 
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200"
          >
            + Add Blog
          </Link>
          <Link 
            to="/admin/blogs" 
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold transition-all duration-200"
          >
            Manage Blogs
          </Link>
          <Link 
            to="/admin/clients" 
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold transition-all duration-200"
          >
            Manage Clients
          </Link>
          <Link 
            to="/admin/activity" 
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold transition-all duration-200"
          >
            System Logs
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
