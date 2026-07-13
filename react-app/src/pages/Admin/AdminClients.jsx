import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatDate } from '../../utils/api';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState('');

  const loadClients = async () => {
    try {
      const data = await api.get('/admin/clients');
      setClients(data.clients || []);
      setFilteredClients(data.clients || []);
    } catch (err) {
      setAlertMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    const lower = q.toLowerCase();
    if (!q) {
      setFilteredClients(clients);
    } else {
      setFilteredClients(
        clients.filter(c =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(lower) ||
          c.email.toLowerCase().includes(lower)
        )
      );
    }
  };

  const handleToggleStatus = async (id, currentActive) => {
    try {
      await api.patch(`/admin/clients/${id}/status`, { is_active: !currentActive });
      loadClients();
    } catch (err) {
      setAlertMsg(err.message);
    }
  };

  return (
    <AdminLayout title="Clients">
      {alertMsg && (
        <div className="p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/50 text-sm mb-5 font-semibold">
          {alertMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm font-extrabold text-gray-900">Clients ({filteredClients.length})</div>
          <input
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white"
            type="search"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        ) : !filteredClients.length ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[220px]">
            <p className="text-sm text-gray-400">No clients found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Name</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Email</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Phone</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Verified</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Joined</th>
                  <th className="py-3.5 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.map(c => (
                  <tr className="hover:bg-gray-50/40 transition-colors" key={c.id}>
                    <td className="py-4 px-6">
                      <Link 
                        to={`/admin/clients/${c.id}`} 
                        className="font-bold text-[#d4001f] hover:text-[#a4001a] hover:underline"
                      >
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-medium">{c.email}</td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-medium">{c.phone || '—'}</td>
                    <td className="py-4 px-6">
                      {c.is_verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-100">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {c.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400">{formatDate(c.created_at)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/clients/${c.id}`} 
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 text-xs font-semibold text-gray-600 hover:text-[#d4001f] hover:bg-rose-500/[0.015] transition-all"
                        >
                          View
                        </Link>
                        <button
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${c.is_active ? 'border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700' : 'border-emerald-200 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700'}`}
                          onClick={() => handleToggleStatus(c.id, c.is_active)}
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
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

