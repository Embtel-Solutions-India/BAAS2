import { useEffect, useState } from 'react';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatDate } from '../../utils/api';

export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setAlertMsg('');
    try {
      const data = await api.get('/admin/activity');
      setLogs(data.logs || []);
      setFilteredLogs(data.logs || []);
    } catch (err) {
      setAlertMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    const lower = q.toLowerCase();
    if (!q) {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(
        logs.filter(l =>
          l.action.toLowerCase().includes(lower) ||
          (l.admin_name || '').toLowerCase().includes(lower)
        )
      );
    }
  };

  return (
    <AdminLayout title="Activity Log">
      {alertMsg && (
        <div className="p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/50 text-sm mb-5 font-semibold">
          {alertMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm font-extrabold text-gray-900">Activity Log ({filteredLogs.length})</div>
          <div className="flex gap-2 items-center">
            <input
              className="w-full sm:w-64 px-3.5 py-1.5 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white"
              type="search"
              placeholder="Search action…"
              value={searchQuery}
              onChange={handleSearch}
            />
            <button 
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 text-xs font-semibold text-gray-600 hover:text-[#d4001f] hover:bg-rose-500/[0.015] transition-all bg-white cursor-pointer"
              onClick={loadLogs}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        ) : !filteredLogs.length ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[220px]">
            <p className="text-sm text-gray-400">No activity yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Timestamp</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Admin</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Action</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">Entity</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3.5 px-6">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((l, idx) => (
                  <tr className="hover:bg-gray-50/40 transition-colors" key={l.id || idx}>
                    <td className="py-4 px-6 text-xs text-gray-400 font-medium whitespace-nowrap">{formatDate(l.created_at)}</td>
                    <td className="py-4 px-6 font-bold text-gray-800">{l.admin_name || '—'}</td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100/50 text-[10px] font-bold tracking-wide">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600 font-semibold">{l.entity_type || '—'}</td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-mono text-[10px]">{l.entity_id || '—'}</td>
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

