import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatDate, statusBadge } from '../../utils/api';

export default function AdminClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertType, setAlertType] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [toggleLoading, setToggleLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const loadClientDetails = async () => {
    try {
      const data = await api.get(`/admin/clients/${id}`);
      setClient(data.client);
      setOrders(data.orders || []);
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadClientDetails();
    }
  }, [id]);

  const handleToggleStatus = async () => {
    if (!client) return;
    setToggleLoading(true);
    setAlertType('');
    setAlertMsg('');
    try {
      await api.patch(`/admin/clients/${id}/status`, { is_active: !client.is_active });
      loadClientDetails();
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSendNotif = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      setAlertType('danger');
      setAlertMsg('Title and body are required.');
      return;
    }

    setSendLoading(true);
    setAlertType('');
    setAlertMsg('');
    try {
      await api.post('/admin/notifications', {
        client_id: id,
        title: notifTitle.trim(),
        body: notifBody.trim()
      });
      setAlertType('success');
      setAlertMsg('Notification sent successfully.');
      setNotifTitle('');
      setNotifBody('');
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
    } finally {
      setSendLoading(false);
    }
  };

  const infoRow = (label, val) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-xs" key={label}>
      <span className="font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="font-bold text-gray-800">{val}</span>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Client Detail">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const avatarLetters = client ? ((client.first_name?.[0] || '') + (client.last_name?.[0] || '')).toUpperCase() : '?';

  return (
    <AdminLayout title={client ? `${client.first_name} ${client.last_name}` : 'Client Detail'}>
      <div className="flex items-center gap-2 mb-6">
        <Link 
          to="/admin/clients" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#d4001f] transition-colors"
        >
          <span>&larr;</span> Back to Clients
        </Link>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-lg border text-sm mb-5 font-semibold ${alertType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' : 'bg-rose-50 text-rose-800 border-rose-200/50'}`}>
          {alertMsg}
        </div>
      )}

      {client && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Left Column: Client Meta Info & Send Notification */}
          <div className="flex flex-col gap-6">
            {/* Client Bio Details */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#d4001f] to-[#a4001a] flex items-center justify-center text-lg font-bold text-white shadow-sm shadow-[#d4001f]/10 shrink-0">
                  {avatarLetters}
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-base font-bold text-gray-900 truncate">{client.first_name} {client.last_name}</div>
                  <div className="text-xs text-gray-500 font-medium truncate">{client.email}</div>
                </div>
              </div>
              {infoRow('Phone', client.phone || '—')}
              {infoRow('Verified', client.is_verified ? 'Yes' : 'No')}
              {infoRow('Status', client.is_active ? 'Active' : 'Inactive')}
              {infoRow('Joined', formatDate(client.created_at))}

              <button
                disabled={toggleLoading}
                onClick={handleToggleStatus}
                className={`w-full mt-5 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${client.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'}`}
              >
                {toggleLoading ? 'Updating…' : client.is_active ? 'Deactivate Client' : 'Activate Client'}
              </button>
            </div>

            {/* Quick Notify Composer */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Send Notification</h4>
              <form onSubmit={handleSendNotif} className="space-y-4">
                <div>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white"
                    placeholder="Title"
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white resize-none"
                    rows={3}
                    placeholder="Message body…"
                    value={notifBody}
                    onChange={e => setNotifBody(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-bold rounded-lg shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
                  disabled={sendLoading}
                >
                  {sendLoading ? 'Sending…' : 'Send Notification'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Order Records */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Orders ({orders.length})</h3>
              <Link 
                to="/admin/orders" 
                className="text-xs font-semibold text-[#d4001f] hover:text-[#a4001a] hover:underline transition-colors"
              >
                All orders &rarr;
              </Link>
            </div>
            {!orders.length ? (
              <div className="flex flex-col items-center justify-center p-12 text-center min-h-[220px]">
                <p className="text-sm text-gray-400">No orders yet.</p>
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
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(o => (
                      <tr className="hover:bg-gray-50/40 transition-colors" key={o.id}>
                        <td className="py-4 px-6 font-bold text-gray-900">{o.order_number}</td>
                        <td className="py-4 px-6 text-xs text-gray-600 font-medium">{o.service_name || '—'}</td>
                        <td className="py-4 px-6 text-xs text-gray-500">{o.state}</td>
                        <td className="py-4 px-6">
                          <span className={`badge badge-${o.status} border border-current/10 font-semibold px-2.5 py-0.5 text-xs rounded-full`}>
                            {statusBadge(o.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-400">{formatDate(o.created_at)}</td>
                        <td className="py-4 px-6 text-right">
                          <Link 
                            to={`/admin/orders/${o.id}`} 
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 text-xs font-semibold text-gray-600 hover:text-[#d4001f] hover:bg-rose-500/[0.015] transition-all"
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
        </div>
      )}
    </AdminLayout>
  );
}
