import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, apiUrl, formatDate, formatCurrency, statusBadge, statusBadgeClass } from '../../utils/api';

export default function AdminInvoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const page = Number(searchParams.get('page') || 1);
  const statusFilter = searchParams.get('status') || 'all';
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';
  const searchQuery = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      params.set('page', String(page));
      params.set('limit', '25');
      const data = await api.get(`/admin/invoices?${params.toString()}`);
      setInvoices(data.invoices || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, fromDate, toDate, page]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e) => { e.preventDefault(); setParam('search', searchInput); };

  // Downloads/views ride the httpOnly auth cookie; admin role is verified server-side.
  const invoiceHref = (inv, inline) => apiUrl(`/admin/invoices/${inv.id}/download${inline ? '?inline=1' : ''}`);
  const viewInvoice = (inv) => window.open(invoiceHref(inv, true), '_blank', 'noopener');
  const printInvoice = (inv) => {
    const w = window.open(invoiceHref(inv, true), '_blank', 'noopener');
    if (w) w.addEventListener('load', () => { try { w.focus(); w.print(); } catch { /* viewer handles print */ } });
  };

  return (
    <AdminLayout title="Invoice Management">
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium border bg-rose-50 border-rose-100 text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 ml-3">&times;</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-gray-900">All Invoices</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search invoice #, order #, client…"
                className="w-60 pl-3 pr-3 py-2 text-xs font-medium border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] focus:ring-2 focus:ring-rose-500/10 transition-all"
              />
            </form>
            <select
              value={statusFilter}
              onChange={e => setParam('status', e.target.value === 'all' ? '' : e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="sent">Sent</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={e => setParam('from', e.target.value)}
              title="From date"
              className="px-2 py-2 text-xs font-medium border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] bg-white cursor-pointer"
            />
            <input
              type="date"
              value={toDate}
              onChange={e => setParam('to', e.target.value)}
              title="To date"
              className="px-2 py-2 text-xs font-medium border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] bg-white cursor-pointer"
            />
            {(fromDate || toDate || statusFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => setSearchParams(new URLSearchParams())}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/30">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice #</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-gray-800">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      {inv.order_number ? (
                        <Link to={`/admin/orders/${inv.order_id}`} className="text-xs font-bold text-[#d4001f] hover:underline">{inv.order_number}</Link>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-gray-800">{inv.client_name || '—'}</div>
                      <div className="text-[10px] text-gray-400">{inv.client_email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{inv.service_name || '—'}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={statusBadgeClass(inv.status)}>{statusBadge(inv.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(inv.paid_at || inv.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => viewInvoice(inv)} title="View invoice"
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">View</button>
                        <a href={invoiceHref(inv, false)} download title="Download PDF"
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">Download</a>
                        <button onClick={() => printInvoice(inv)} title="Print invoice"
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">Print</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setParam('page', String(p))}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${p === pagination.page ? 'bg-[#d4001f] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
