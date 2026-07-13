import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatDate, statusBadge } from '../../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    documents: 0,
    unpaidInvoices: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userMe = await api.get('/auth/me');
        if (userMe?.user) {
          setFirstName(userMe.user.first_name);
        }

        const [ordersRes, docsRes, invoicesRes, notifsRes] = await Promise.allSettled([
          api.get('/orders'),
          api.get('/documents'),
          api.get('/invoices'),
          api.get('/notifications')
        ]);

        const ordersList = ordersRes.status === 'fulfilled' ? ordersRes.value.orders : [];
        const docsList = docsRes.status === 'fulfilled' ? docsRes.value.documents : [];
        const invoicesList = invoicesRes.status === 'fulfilled' ? invoicesRes.value.invoices : [];
        const notifsList = notifsRes.status === 'fulfilled' ? notifsRes.value.notifications : [];

        const ACTIVE_STATUSES = ['pending', 'in_review', 'processing', 'submitted', 'approved'];

        setStats({
          totalOrders: ordersList.length,
          activeOrders: ordersList.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
          documents: docsList.length,
          unpaidInvoices: invoicesList.filter(i => ['sent', 'overdue'].includes(i.status)).length
        });

        setRecentOrders(ordersList.slice(0, 5));
        setRecentNotifications(notifsList.filter(n => !n.is_read).slice(0, 5));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <PortalLayout title="Dashboard" subtitle="Welcome to your portal">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Dashboard" subtitle="Welcome to your portal">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#d4001f] to-[#a4001a] text-white rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md shadow-rose-950/10 border border-rose-800/20 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
            Welcome back, {firstName || 'Client'}!
          </h2>
          <p className="text-white/80 text-sm max-w-md">
            Here's a quick overview of your account activity, documents, and pending orders.
          </p>
        </div>
        <Link 
          to="/client-portal/new-order" 
          className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/30 text-white bg-white/10 backdrop-blur-xs hover:bg-white/20 hover:border-white transition-all duration-200 text-sm font-semibold shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
          </svg>
          New Order
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Orders Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/[0.02] rounded-bl-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#d4001f] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Orders</span>
          <span className="text-3xl font-bold text-gray-900 tracking-tight font-serif mt-0.5">{stats.totalOrders}</span>
        </div>

        {/* Active Orders Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/[0.02] rounded-bl-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-amber-50/50 border border-amber-100/50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Orders</span>
          <span className="text-3xl font-bold text-gray-900 tracking-tight font-serif mt-0.5">{stats.activeOrders}</span>
        </div>

        {/* Documents Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/[0.02] rounded-bl-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-blue-50/50 border border-blue-100/50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documents</span>
          <span className="text-3xl font-bold text-gray-900 tracking-tight font-serif mt-0.5">{stats.documents}</span>
        </div>

        {/* Unpaid Invoices Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-1.5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/[0.02] rounded-bl-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-rose-50/50 border border-rose-100/50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unpaid Invoices</span>
          <span className="text-3xl font-bold text-gray-900 tracking-tight font-serif mt-0.5">{stats.unpaidInvoices}</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
            <Link 
              to="/client-portal/orders" 
              className="text-xs font-semibold text-[#d4001f] hover:text-[#a4001a] hover:underline transition-all flex items-center gap-1"
            >
              View all
              <span>→</span>
            </Link>
          </div>

          <div className="flex-1">
            {!recentOrders.length ? (
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <p className="text-gray-400 text-sm">No orders yet.</p>
                <Link 
                  to="/client-portal/new-order" 
                  className="mt-4 px-4 py-2 rounded-lg bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Place First Order
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Order #</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Service</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map(o => (
                      <tr className="hover:bg-gray-50/40 transition-colors" key={o.id}>
                        <td className="py-3.5 px-6 font-semibold">
                          <Link 
                            to={`/client-portal/orders/${o.id}`} 
                            className="text-[#d4001f] hover:text-[#a4001a] hover:underline"
                          >
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-6 text-gray-600 font-medium">{o.service_name || '—'}</td>
                        <td className="py-3.5 px-6">
                          <span className={`badge badge-${o.status} border border-current/10 font-semibold px-2.5 py-0.5 text-xs rounded-full`}>
                            {statusBadge(o.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Recent Notifications</h3>
            <Link 
              to="/client-portal/notifications" 
              className="text-xs font-semibold text-[#d4001f] hover:text-[#a4001a] hover:underline transition-all flex items-center gap-1"
            >
              View all
              <span>→</span>
            </Link>
          </div>

          <div className="flex-1 p-5 space-y-3">
            {!recentNotifications.length ? (
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.04 9.04 0 01-2.857 0m-2.857 0a9.04 9.04 0 01-2.857 0m9.04 0h-9.04M12 17V4m0 13a9 9 0 110-18 9 9 0 010 18z" />
                </svg>
                <p className="text-gray-400 text-sm">No new notifications.</p>
              </div>
            ) : (
              recentNotifications.map(n => (
                <div 
                  key={n.id} 
                  className="p-4 rounded-xl border border-gray-50 bg-rose-500/[0.015] hover:bg-rose-500/[0.035] transition-colors border-l-4 border-l-[#d4001f] shadow-xs"
                >
                  <div className="text-sm font-semibold text-gray-900 leading-tight">{n.title}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {n.body}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 font-medium tracking-wide">
                    {formatDate(n.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

