import { useEffect, useState } from 'react';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api } from '../../utils/api';

export default function AdminNotifications() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [type, setType] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});
  const [alertType, setAlertType] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await api.get('/admin/clients');
        setClients(data.clients || []);
      } catch (err) {
        console.error('Error loading clients for notifications:', err);
      } finally {
        setFetchingClients(false);
      }
    }
    loadClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setAlertType('');
    setAlertMsg('');

    let valid = true;
    const newErrors = {};

    if (!clientId) {
      newErrors.client_id = 'Select a client';
      valid = false;
    }
    if (!title.trim()) {
      newErrors.title = 'Title is required';
      valid = false;
    }
    if (!body.trim()) {
      newErrors.body = 'Message is required';
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/notifications', {
        client_id: clientId,
        type,
        title: title.trim(),
        body: body.trim()
      });
      setAlertType('success');
      setAlertMsg('Notification sent successfully.');
      setClientId('');
      setType('general');
      setTitle('');
      setBody('');
    } catch (err) {
      setAlertType('danger');
      setAlertMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Send Notification">
      <div className="max-w-2xl">
        {alertMsg && (
          <div className={`p-4 rounded-lg border text-sm mb-5 font-semibold ${alertType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' : 'bg-rose-50 text-rose-800 border-rose-200/50'}`}>
            {alertMsg}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-extrabold text-gray-900 mb-1">Send a Notification</h3>
          <p className="text-xs text-gray-500 font-medium mb-6">Push a notification to a specific client's portal dashboard.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="client_id" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Client <span className="text-[#d4001f]">*</span>
              </label>
              <select
                id="client_id"
                className={`w-full px-3.5 py-2.5 rounded-lg border focus:ring-3 outline-none text-xs transition-all bg-white disabled:opacity-50 appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_14px_center] bg-no-repeat cursor-pointer ${errors.client_id ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                value={clientId}
                onChange={e => {
                  setClientId(e.target.value);
                  setErrors({ ...errors, client_id: '' });
                }}
                required
                disabled={fetchingClients}
              >
                {fetchingClients ? (
                  <option value="">Loading clients…</option>
                ) : (
                  <>
                    <option value="">Select a client…</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.email})
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errors.client_id && <div className="text-xs text-rose-600 font-semibold mt-1.5">{errors.client_id}</div>}
            </div>

            <div>
              <label htmlFor="type" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Type</label>
              <select
                id="type"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_14px_center] bg-no-repeat cursor-pointer"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="general">General</option>
                <option value="order_update">Order Update</option>
                <option value="message">Message Alert</option>
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Title <span className="text-[#d4001f]">*</span>
              </label>
              <input
                type="text"
                id="title"
                className={`w-full px-3.5 py-2.5 rounded-lg border focus:ring-3 outline-none text-xs transition-all bg-white ${errors.title ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                placeholder="e.g. Your order has been processed"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setErrors({ ...errors, title: '' });
                }}
                required
              />
              {errors.title && <div className="text-xs text-rose-600 font-semibold mt-1.5">{errors.title}</div>}
            </div>

            <div>
              <label htmlFor="body" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Message <span className="text-[#d4001f]">*</span>
              </label>
              <textarea
                id="body"
                className={`w-full px-3.5 py-2.5 rounded-lg border focus:ring-3 outline-none text-xs transition-all bg-white resize-none ${errors.body ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-[#d4001f] focus:ring-[#d4001f]/10'}`}
                rows={4}
                placeholder="Notification body text…"
                value={body}
                onChange={e => {
                  setBody(e.target.value);
                  setErrors({ ...errors, body: '' });
                }}
                required
              ></textarea>
              {errors.body && <div className="text-xs text-rose-600 font-semibold mt-1.5">{errors.body}</div>}
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-bold rounded-lg shadow-xs shadow-rose-900/10 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pt-2.5" 
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send Notification'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

