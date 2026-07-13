import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatDate, formatCurrency, statusBadge } from '../../utils/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState('');

  const loadOrders = async () => {
    try {
      const data = await api.get('/admin/orders');
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (err) {
      setAlertMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filterAndSearch = (filter, query, list = orders) => {
    const q = query.toLowerCase();
    const result = list.filter(o => {
      const matchFilter = filter === 'all' || o.status === filter;
      const matchSearch = !q ||
        o.order_number.toLowerCase().includes(q) ||
        (o.client_name || '').toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
    setFilteredOrders(result);
  };

  const handleFilter = (filter) => {
    setActiveFilter(filter);
    filterAndSearch(filter, searchQuery);
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    filterAndSearch(activeFilter, q);
  };

  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'processing', label: 'Processing' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <AdminLayout title="Orders">
      {alertMsg && (
        <div className="p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/50 text-sm mb-5 font-semibold">
          {alertMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm font-extrabold text-gray-900">Orders ({filteredOrders.length})</div>
          <input
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white"
            type="search"
            placeholder="Search order # or client…"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Tab-style filter menu */}
        <div className="flex items-center gap-1.5 flex-wrap px-6 py-3.5 border-b border-gray-100 bg-gray-50/40">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all ${activeFilter === f.value ? 'bg-white text-gray-900 shadow-xs border border-gray-150' : 'text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent'}`}
              onClick={() => handleFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        ) : !filteredOrders.length ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            <h4 className="text-base font-bold text-gray-800 mb-1">No orders found</h4>
            <p className="text-sm text-gray-400 mb-4 max-w-xs">Change your search query or select another filter option.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Order #</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Client</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Service</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">State</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Amount</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map(o => (
                  <tr className="hover:bg-gray-50/40 transition-colors" key={o.id}>
                    <td className="py-4 px-6 font-bold text-gray-900">{o.order_number}</td>
                    <td className="py-4 px-6">
                      <Link 
                        to={`/admin/clients/${o.client_id}`} 
                        className="text-[#d4001f] hover:text-[#a4001a] hover:underline text-xs font-bold"
                      >
                        {o.client_name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600 font-medium">{o.service_name || '—'}</td>
                    <td className="py-4 px-6 text-xs text-gray-500">{o.state}</td>
                    <td className="py-4 px-6">
                      <span className={`badge badge-${o.status} border border-current/10 font-semibold px-2.5 py-0.5 text-xs rounded-full`}>
                        {statusBadge(o.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900 text-xs">{formatCurrency(o.total_amount)}</td>
                    <td className="py-4 px-6 text-xs text-gray-400">{formatDate(o.created_at)}</td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        to={`/admin/orders/${o.id}`} 
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 text-xs font-semibold text-gray-600 hover:text-[#d4001f] hover:bg-rose-500/[0.015] transition-all"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

