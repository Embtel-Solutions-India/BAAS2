import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, apiUrl, formatDate, formatCurrency, statusBadge } from '../../utils/api';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertType, setAlertType] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const chatMessagesRef = useRef(null);

  const STATUSES = ['pending', 'in_review', 'processing', 'submitted', 'approved', 'completed', 'cancelled'];

  const loadOrderDetails = async () => {
    try {
      const [orderRes, msgsRes] = await Promise.all([
        api.get(`/admin/orders/${id}`),
        api.get(`/admin/orders/${id}/messages`)
      ]);
      setOrder(orderRes.order);
      setHistory(orderRes.history || []);
      setDocuments(orderRes.documents || []);
      setMessages(msgsRes.messages || []);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const handleUpdateStatus = async (status) => {
    setAlertType('');
    setAlertMsg('');
    try {
      await api.patch(`/admin/orders/${id}/status`, { status, note: statusNote.trim() || undefined });
      setAlertType('success');
      setAlertMsg(`Status updated to ${status}.`);
      setStatusNote('');
      loadOrderDetails();
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    setSendLoading(true);
    try {
      await api.post(`/admin/orders/${id}/messages`, { body: msgInput.trim() });
      setMsgInput('');
      loadOrderDetails();
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
    } finally {
      setSendLoading(false);
    }
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const infoRow = (label, val) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-xs" key={label}>
      <span className="font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="font-bold text-gray-800">{val}</span>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Order Detail">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={order ? order.order_number : 'Order Detail'}>
      <div className="flex items-center gap-2 mb-6">
        <Link 
          to="/admin/orders" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#d4001f] transition-colors"
        >
          <span>&larr;</span> Back to Orders
        </Link>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-lg border text-sm mb-5 font-semibold ${alertType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' : 'bg-rose-50 text-rose-800 border-rose-200/50'}`}>
          {alertMsg}
        </div>
      )}

      {order && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left Column: Form / History / Messages / Docs */}
          <div className="flex flex-col gap-6">
            
            {/* Update Status */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Update Status</h4>
              <div className="flex gap-2 flex-wrap mb-4">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer border ${order.status === s ? 'bg-[#d4001f] border-[#d4001f] text-white shadow-xs shadow-rose-900/10' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {capitalize(s.replace('_', ' '))}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Internal note (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white"
                  placeholder="e.g. Filed with state, awaiting confirmation…"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                />
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-6">Status History</h4>
              <div className="relative pl-6 border-l border-gray-100 space-y-6 ml-2 py-1">
                {history.map((h, i) => (
                  <div className="relative" key={h.id || i}>
                    <div className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ring-offset-0 transition-all ${i === 0 ? 'bg-[#d4001f] ring-[#d4001f]/15' : 'bg-gray-300 ring-gray-150/45'}`}></div>
                    <div className="text-xs font-bold text-gray-800">{capitalize(h.status.replace('_', ' '))}</div>
                    {h.note && (
                      <div className="text-xs text-gray-500 mt-1.5 bg-gray-50 border border-gray-100/50 p-2.5 rounded-lg leading-relaxed max-w-lg">
                        {h.note}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 font-semibold tracking-wide mt-1.5">
                      {formatDate(h.created_at)} &bull; {h.changed_by || 'System'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Messages Chat Bubble */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Client Messages</h4>
              <div
                className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-3 py-2"
                ref={chatMessagesRef}
              >
                {!messages.length ? (
                  <p className="text-xs text-gray-400 text-center py-6">No messages yet.</p>
                ) : (
                  messages.map(m => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender_role === 'client' ? 'self-start items-start' : 'self-end items-end'} max-w-[80%]`}
                    >
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">
                        {m.sender_role === 'client' ? 'Client' : 'Admin'}
                      </span>
                      <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed border ${m.sender_role === 'client' ? 'bg-gray-50 text-gray-700 border-gray-100 rounded-bl-xs' : 'bg-rose-50/50 text-gray-700 border-rose-100/50 rounded-br-xs'}`}>
                        {m.body}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 px-1">{formatDate(m.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 mt-4 items-end">
                <textarea
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white resize-none min-h-[44px]"
                  rows={2}
                  placeholder="Reply to client…"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-bold rounded-lg shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-50 shrink-0"
                  disabled={sendLoading}
                >
                  {sendLoading ? 'Sending…' : 'Send'}
                </button>
              </form>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Documents ({documents.length})</h4>
              {!documents.length ? (
                <p className="text-xs text-gray-400 py-2">No documents attached.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {documents.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <div className="text-xs font-bold text-gray-800">{d.name}</div>
                        <div className="text-[10px] text-gray-400 font-semibold tracking-wide mt-0.5">{d.type} &bull; {formatDate(d.created_at)}</div>
                      </div>
                      <a 
                        href={apiUrl(`/documents/${d.id}/download`)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 text-[10px] font-bold text-gray-600 hover:text-[#d4001f] hover:bg-rose-500/[0.015] transition-all"
                        download
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Info Panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Order Info</h4>
              {infoRow('Order #', order.order_number)}
              {infoRow('Client', <Link to={`/admin/clients/${order.client_id}`} className="text-[#d4001f] hover:text-[#a4001a] hover:underline font-bold">{order.client_name}</Link>)}
              {infoRow('Service', order.service_name || '—')}
              {infoRow('State', order.state)}
              {infoRow('Status', (
                <span className={`badge badge-${order.status} border border-current/10 font-semibold px-2.5 py-0.5 text-xs rounded-full`}>
                  {statusBadge(order.status)}
                </span>
              ))}
              {infoRow('Amount', formatCurrency(order.total_amount))}
              {infoRow('Placed', formatDate(order.created_at))}
              {order.notes && (
                <div className="pt-3 text-xs leading-relaxed text-gray-500">
                  <span className="font-semibold text-gray-400 block mb-1">Notes:</span>
                  {order.notes}
                </div>
              )}
            </div>

            {/* Payment panel */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Payment</h4>
                <Link to={`/admin/payments?search=${encodeURIComponent(order.order_number)}`} className="text-xs font-semibold text-[#d4001f] hover:text-[#a4001a] hover:underline">Transactions →</Link>
              </div>
              {infoRow('Payment status', (
                <span className={`badge badge-${order.payment_status} border border-current/10 font-semibold px-2.5 py-0.5 text-xs rounded-full`}>
                  {statusBadge(order.payment_status)}
                </span>
              ))}
              {infoRow('Amount', formatCurrency(order.total_amount))}
              {order.transaction_id
                ? infoRow('Transaction ID', <span className="font-mono text-[11px] break-all">{order.transaction_id}</span>)
                : infoRow('Transaction ID', <span className="text-gray-400">—</span>)}
              {order.qb_payment_id && infoRow('QuickBooks ID', <span className="font-mono text-[11px] break-all">{order.qb_payment_id}</span>)}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

