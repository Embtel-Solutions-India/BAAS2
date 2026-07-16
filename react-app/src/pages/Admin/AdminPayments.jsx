import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import MiniLineChart from '../../components/Admin/MiniLineChart';
import { api, apiUrl, formatDate, formatCurrency, statusBadge, statusBadgeClass } from '../../utils/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GRANS = [{ key: 'day', label: 'Day' }, { key: 'month', label: 'Month' }, { key: 'year', label: 'Year' }];

function fmtPeriod(period, gran) {
  if (gran === 'day') return period.slice(8);
  if (gran === 'year') return period;
  const [, m] = period.split('-');
  return MONTHS[Number(m) - 1] || period;
}

function GranToggle({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {GRANS.map(g => (
        <button
          key={g.key}
          type="button"
          onClick={() => onChange(g.key)}
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${value === g.key ? 'bg-[#d4001f] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [qbStatus, setQbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState(null);

  // Revenue trend granularity (Day / Month / Year)
  const [trendGran, setTrendGran] = useState('month');
  const [trendSeries, setTrendSeries] = useState(null);

  const page = Number(searchParams.get('page') || 1);
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await api.get('/admin/payments/analytics');
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', String(page));
      params.set('limit', '25');
      const data = await api.get(`/admin/payments?${params.toString()}`);
      setPayments(data.payments || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  const loadQbStatus = useCallback(async () => {
    try {
      const data = await api.get('/quickbooks/status');
      setQbStatus(data);
    } catch (err) {
      console.error('QB status error:', err);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadQbStatus();
  }, [loadAnalytics, loadQbStatus]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    let live = true;
    api.get(`/admin/payments/revenue-trend?granularity=${trendGran}`)
      .then(d => { if (live) setTrendSeries(d.trend || []); })
      .catch(() => { if (live) setTrendSeries([]); });
    return () => { live = false; };
  }, [trendGran]);

  // Handle QB OAuth redirect result
  useEffect(() => {
    const qbResult = searchParams.get('qb');
    if (qbResult) {
      const messages = {
        connected: 'QuickBooks connected successfully!',
        error: 'Failed to connect QuickBooks. Please try again.',
        invalid_state: 'Invalid OAuth state. Please retry the connection.'
      };
      if (messages[qbResult]) {
        setError(messages[qbResult]);
        if (qbResult === 'connected') {
          loadQbStatus();
          loadAnalytics();
        }
      }
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('qb');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, loadQbStatus, loadAnalytics]);

  const handleConnectQb = async () => {
    setActionLoading(true);
    try {
      const { url } = await api.get('/quickbooks/connect');
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleDisconnectQb = async () => {
    if (!confirm('Disconnect QuickBooks? You will need to reconnect to process payments.')) return;
    setActionLoading(true);
    try {
      await api.post('/quickbooks/disconnect');
      await loadQbStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) newParams.set('search', searchInput);
    else newParams.delete('search');
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleStatusChange = (value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value !== 'all') newParams.set('status', value);
    else newParams.delete('status');
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleExport = (type) => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    const url = `/admin/payments/export/${type}?${params.toString()}`;
    window.open(apiUrl(url), '_blank');
  };

  const openRefund = (payment) => {
    setRefundTarget(payment);
    setRefundAmount('');
    setRefundReason('');
    setRefundError(null);
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setActionLoading(true);
    setRefundError(null);
    try {
      const body = {};
      if (refundAmount) body.amount = Number(refundAmount);
      if (refundReason.trim()) body.reason = refundReason.trim();
      await api.post(`/admin/payments/${refundTarget.id}/refund`, body);
      setRefundTarget(null);
      await loadPayments();
      await loadAnalytics();
    } catch (err) {
      setRefundError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const revenueChart = (trendSeries || []).map(m => ({ label: fmtPeriod(m.period, trendGran), fullLabel: m.period, value: m.revenue }));

  return (
    <AdminLayout title="Payment Management">
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium border bg-rose-50 border-rose-100 text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 ml-3">&times;</button>
        </div>
      )}

      {/* QuickBooks Connection Banner */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#2CA01C]/10 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-[#2CA01C]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                QuickBooks Payments
                {qbStatus?.demo && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200/60">Demo</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {qbStatus?.connected
                  ? <>Connected &mdash; Realm: <span className="font-mono">{qbStatus.realm_id}</span> &mdash; {qbStatus.environment}{qbStatus?.demo ? ' (simulated)' : ''}</>
                  : qbStatus?.configured
                    ? (qbStatus?.demo ? 'Not connected — click "Connect QuickBooks" to enable demo payments' : 'Not connected — click "Connect QuickBooks" to start accepting payments')
                    : 'Not configured — add QUICKBOOKS_* vars to server .env'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {qbStatus?.connected ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                </span>
                <button
                  onClick={handleDisconnectQb}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectQb}
                disabled={actionLoading || !qbStatus?.configured}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2CA01C] hover:bg-[#248016] text-white shadow-xs hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Connecting…' : 'Connect QuickBooks'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Revenue" value={analyticsLoading ? '—' : formatCurrency(analytics?.total_revenue)} sub={`Refunded: ${formatCurrency(analytics?.total_refunded || 0)}`} color="emerald" />
        <KpiCard label="Today's Revenue" value={analyticsLoading ? '—' : formatCurrency(analytics?.today_revenue)} sub={`This month: ${formatCurrency(analytics?.month_revenue || 0)}`} color="blue" />
        <KpiCard label="Successful Payments" value={analyticsLoading ? '—' : analytics?.successful_payments} sub={`Failed: ${analytics?.failed_payments || 0}`} color="emerald" />
        <KpiCard label="Success Rate" value={analyticsLoading ? '—' : analytics?.success_rate != null ? `${analytics.success_rate}%` : '—'} sub={`Pending: ${analytics?.pending_payments || 0}`} color="amber" />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-50">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Trend</h3>
          <GranToggle value={trendGran} onChange={setTrendGran} />
        </div>
        {trendSeries === null ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-400">Loading…</div>
        ) : !revenueChart.length ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-400">No revenue data yet.</div>
        ) : (
          <MiniLineChart data={revenueChart} color="#d4001f" formatValue={formatCurrency} />
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-gray-900">All Payments</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search order #, client, txn…"
                className="w-56 pl-3 pr-3 py-2 text-xs font-medium border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] focus:ring-2 focus:ring-rose-500/10 transition-all"
              />
            </form>
            <select
              value={statusFilter}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => handleExport('payments')}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Export Payments
            </button>
            <button
              onClick={() => handleExport('orders')}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Export Orders
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">No payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/30">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment ID</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">#{p.id}</td>
                    <td className="px-4 py-3">
                      {p.order_number ? (
                        <Link to={`/admin/orders/${p.order_id}`} className="text-xs font-bold text-[#d4001f] hover:underline">{p.order_number}</Link>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-gray-800">{p.client_name || '—'}</div>
                      <div className="text-[10px] text-gray-400">{p.client_email}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-xs font-bold text-gray-900">{formatCurrency(p.amount)}</div>
                      {p.refunded_amount > 0 && <div className="text-[10px] text-amber-600 font-medium">Refunded: {formatCurrency(p.refunded_amount)}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={statusBadgeClass(p.status)}>{statusBadge(p.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {p.method === 'card' && p.card_last4 ? `Card ••••${p.card_last4}` : (p.method || '—')}
                      {p.card_type ? <div className="text-[10px] text-gray-400">{p.card_type}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'completed' && p.gateway === 'quickbooks' && p.qb_payment_id ? (
                        <button
                          onClick={() => openRefund(p)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all"
                        >
                          Refund
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
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
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', String(p));
                    setSearchParams(newParams);
                  }}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${p === pagination.page ? 'bg-[#d4001f] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setRefundTarget(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">Refund Payment</h3>
            <p className="text-xs text-gray-500 mb-4">Payment #{refundTarget.id} — {refundTarget.client_name}</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Original Amount</span>
                <span className="font-bold text-gray-900">{formatCurrency(refundTarget.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Already Refunded</span>
                <span className="font-bold text-amber-600">{formatCurrency(refundTarget.refunded_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                <span className="text-gray-500">Refundable</span>
                <span className="font-bold text-emerald-600">{formatCurrency(refundTarget.amount - (refundTarget.refunded_amount || 0))}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Refund Amount (leave blank for full)</label>
              <input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder={((refundTarget.amount - (refundTarget.refunded_amount || 0)).toFixed(2))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] focus:ring-2 focus:ring-rose-500/10"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason (optional)</label>
              <input
                type="text"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="e.g. Customer request"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] focus:ring-2 focus:ring-rose-500/10"
              />
            </div>

            {refundError && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 border border-rose-100 text-rose-700">{refundError}</div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRefundTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Processing…' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function KpiCard({ label, value, sub, color }) {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50/50 border-emerald-100/50',
    blue: 'text-blue-600 bg-blue-50/50 border-blue-100/50',
    amber: 'text-amber-600 bg-amber-50/50 border-amber-100/50',
    rose: 'text-rose-600 bg-rose-50/50 border-rose-100/50'
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className={`text-2xl font-bold tracking-tight font-serif mt-1 ${colorMap[color]?.split(' ')[0] || 'text-gray-900'}`}>{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
