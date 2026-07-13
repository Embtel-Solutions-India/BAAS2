import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatDate, formatCurrency, statusBadge } from '../../utils/api';

export default function Orders() {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.get('/orders');
        const list = data.orders || [];
        setAllOrders(list);
        setFilteredOrders(list);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleFilter = (filter) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(allOrders.filter(o => o.status === filter));
    }
  };

  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <PortalLayout title="My Orders" subtitle="Track and manage your orders">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight sm:text-2xl">My Orders</h1>
        <Link 
          to="/client-portal/new-order" 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#d4001f] hover:bg-[#a4001a] text-white rounded-lg text-sm font-semibold shadow-xs shadow-rose-900/10 hover:shadow-md transition-all duration-200 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
          </svg>
          New Order
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap mb-6 bg-gray-50 border border-gray-200/50 p-1.5 rounded-xl max-w-max">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeFilter === f.value ? 'bg-white text-gray-900 shadow-xs border border-gray-100/50' : 'text-gray-500 hover:text-gray-900 hover:bg-white/40 border border-transparent'}`}
            onClick={() => handleFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table Card wrapper */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        )}

        {errorMsg && (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <p className="text-sm font-semibold text-rose-600">{errorMsg}</p>
          </div>
        )}

        {!loading && !errorMsg && (
          <div id="orders-table-wrap">
            {!filteredOrders.length ? (
              <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                <h4 className="text-base font-bold text-gray-800 mb-1">No orders found</h4>
                <p className="text-sm text-gray-400 mb-4 max-w-xs">Place your first order or change the filter criteria.</p>
                <Link 
                  to="/client-portal/new-order" 
                  className="px-4 py-2 rounded-lg bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  New Order
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Order #</th>
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
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {o.order_number}
                        </td>
                        <td className="py-4 px-6 text-gray-600 font-medium">{o.service_name || '—'}</td>
                        <td className="py-4 px-6 text-gray-500">{o.state || '—'}</td>
                        <td className="py-4 px-6">
                          <span className={`badge badge-${o.status} border border-current/10 font-semibold px-2.5 py-0.5 text-xs rounded-full`}>
                            {statusBadge(o.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900">{formatCurrency(o.total_amount)}</td>
                        <td className="py-4 px-6 text-gray-400 text-xs">{formatDate(o.created_at)}</td>
                        <td className="py-4 px-6 text-right">
                          <Link 
                            to={`/client-portal/orders/${o.id}`} 
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 text-xs font-semibold text-gray-600 hover:text-[#d4001f] hover:bg-rose-500/[0.015] transition-all"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

