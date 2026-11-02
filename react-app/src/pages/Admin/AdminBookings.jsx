import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, apiUrl } from '../../utils/api';
import { getAvailableSlots } from '../../utils/bookingApi';
import { formatShortDate, formatTime, todayIn } from '../../utils/bookingDates';

const STATUSES = ['confirmed', 'completed', 'no_show', 'cancelled'];
const STATUS_STYLE = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  no_show: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};
const DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']];
const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-2 focus:ring-[#d4001f]/10 outline-none text-sm bg-white';
const btn = 'px-3.5 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50';
const btnPrimary = `${btn} bg-[#d4001f] text-white hover:bg-[#a4001a]`;
const btnGhost = `${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`;

const Pill = ({ status }) => <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.cancelled}`}>{status.replace('_', ' ')}</span>;

export default function AdminBookings() {
  const [tab, setTab] = useState('bookings');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const say = (text, type = 'ok') => setNotice({ type, text });

  return (
    <AdminLayout title="Appointments">
      {notice.text && (
        <div role="status" className={`p-3 rounded-lg text-sm mb-5 font-semibold border ${notice.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>{notice.text}</div>
      )}
      <div className="flex gap-2 mb-5" role="tablist" aria-label="Appointment sections">
        {[['bookings', 'Bookings'], ['settings', 'Availability & settings']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`${btn} ${tab === id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{label}</button>
        ))}
      </div>
      {tab === 'bookings' ? <BookingsTab say={say} /> : <SettingsTab say={say} />}
    </AdminLayout>
  );
}

/* ---------------- Bookings ---------------- */
function BookingsTab({ say }) {
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', from: '', to: '', sort: 'asc' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ bookings: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: '25', sort: filters.sort });
    ['q', 'status', 'from', 'to'].forEach((k) => { if (filters[k]) p.set(k, filters[k]); });
    return p.toString();
  }, [filters, page]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get(`/admin/bookings?${query}`), api.get('/admin/bookings/stats')])
      .then(([list, st]) => { if (alive) { setData(list); setStats(st); setLoading(false); } })
      .catch((err) => { if (alive) { say(err.message, 'error'); setLoading(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, reloadKey]);

  const refresh = () => setReloadKey((n) => n + 1);
  const setF = (k, v) => { setPage(1); setLoading(true); setFilters((f) => ({ ...f, [k]: v })); };
  const exportCsv = () => {
    const p = new URLSearchParams();
    ['q', 'status', 'from', 'to'].forEach((k) => { if (filters[k]) p.set(k, filters[k]); });
    window.location.href = apiUrl(`/admin/bookings/export?${p}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[['Total bookings', stats && stats.total], ["Today's bookings", stats && stats.today], ['Upcoming', stats && stats.upcoming], ['Cancelled', stats && stats.cancelled]].map(([label, n]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-500 font-semibold">{label}</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{n ?? '–'}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input className={`${input} lg:col-span-2`} type="search" placeholder="Search name, email, phone, reference" aria-label="Search bookings" value={filters.q} onChange={(e) => setF('q', e.target.value)} />
          <select className={input} aria-label="Filter by status" value={filters.status} onChange={(e) => setF('status', e.target.value)}>
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <input className={input} type="date" aria-label="From date" value={filters.from} onChange={(e) => setF('from', e.target.value)} />
          <input className={input} type="date" aria-label="To date" value={filters.to} onChange={(e) => setF('to', e.target.value)} />
          <div className="flex gap-2">
            <select className={input} aria-label="Sort order" value={filters.sort} onChange={(e) => setF('sort', e.target.value)}><option value="asc">Soonest first</option><option value="desc">Latest first</option></select>
            <button type="button" className={btnGhost} onClick={exportCsv}>Export CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              {['Date & time', 'Customer', 'Topic', 'Reference', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>}
              {!loading && !data.bookings.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No bookings match these filters.</td></tr>}
              {!loading && data.bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 whitespace-nowrap"><div className="font-semibold text-gray-900">{formatShortDate(b.localDate)}</div><div className="text-xs text-gray-500">{formatTime(b.localStartTime)} – {formatTime(b.localEndTime)}</div></td>
                  <td className="px-4 py-3"><div className="font-semibold text-gray-900">{b.customerName}</div><div className="text-xs text-gray-500 break-all">{b.customerEmail}</div></td>
                  <td className="px-4 py-3 text-gray-700">{b.purpose}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{b.reference}</td>
                  <td className="px-4 py-3"><Pill status={b.status} /></td>
                  <td className="px-4 py-3 text-right"><button type="button" className={btnGhost} onClick={() => setOpen(b)}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex items-center justify-between text-xs text-gray-500">
          <span>{data.total} booking{data.total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button type="button" className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {page} of {data.pages}</span>
            <button type="button" className={btnGhost} disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {open && <BookingDrawer booking={open} onClose={() => setOpen(null)} onChanged={(b, msg) => { setOpen(b); say(msg); refresh(); }} say={say} />}
    </>
  );
}

function BookingDrawer({ booking, onClose, onChanged, say }) {
  const [mode, setMode] = useState('view'); // view | cancel | reschedule
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState(booking.internalNotes || '');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState({ date: '', list: [], error: '' });
  const [time, setTime] = useState('');
  const [silent, setSilent] = useState(false);
  const loadingSlots = !!date && slots.date !== date;

  useEffect(() => {
    if (!date) return undefined;
    let alive = true;
    getAvailableSlots(date, { force: true })
      .then((d) => { if (alive) setSlots({ date, list: d.slots.filter((s) => s.available), error: d.slots.length ? '' : (d.reason || 'No times on that date.') }); })
      .catch((err) => { if (alive) setSlots({ date, list: [], error: err.message }); });
    return () => { alive = false; };
  }, [date]);

  const run = async (fn, msg) => {
    setBusy(true);
    try { const r = await fn(); onChanged(r.booking, msg); setMode('view'); } catch (err) { say(err.message, 'error'); } finally { setBusy(false); }
  };
  const id = booking.id;
  const active = booking.status === 'confirmed';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label={`Booking ${booking.reference}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div><div className="font-mono text-xs text-gray-500">{booking.reference}</div><h2 className="text-lg font-extrabold text-gray-900">{booking.customerName}</h2></div>
          <button type="button" className={btnGhost} onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="mb-4"><Pill status={booking.status} /></div>
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm mb-5">
          {[['When', `${formatShortDate(booking.localDate)}, ${formatTime(booking.localStartTime)} – ${formatTime(booking.localEndTime)} (${booking.timezone})`],
            ['Email', booking.customerEmail], ['Phone', booking.customerPhone], ['Company', booking.companyName || '–'], ['Topic', booking.purpose],
            ['Type', booking.appointmentTypeLabel || booking.appointmentType], ['Notes', booking.customerNotes || '–']].map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-gray-500">{k}</dt><dd className="text-gray-900 break-words whitespace-pre-wrap">{v}</dd></div>
          ))}
        </dl>

        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="adm-notes">Internal notes</label>
        <textarea id="adm-notes" className={input} rows={3} maxLength={3000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex flex-wrap gap-2 mt-2 mb-5">
          <button type="button" className={btnGhost} disabled={busy} onClick={() => run(() => api.patch(`/admin/bookings/${id}`, { internalNotes: notes }), 'Notes saved.')}>Save notes</button>
          {active && <button type="button" className={btnGhost} disabled={busy} onClick={() => run(() => api.patch(`/admin/bookings/${id}`, { status: 'completed' }), 'Marked completed.')}>Mark completed</button>}
          {active && <button type="button" className={btnGhost} disabled={busy} onClick={() => run(() => api.patch(`/admin/bookings/${id}`, { status: 'no_show' }), 'Marked no-show.')}>Mark no-show</button>}
        </div>

        {active && mode === 'view' && (
          <div className="flex gap-2 mb-5">
            <button type="button" className={btnPrimary} onClick={() => setMode('reschedule')}>Reschedule</button>
            <button type="button" className={btnGhost} onClick={() => setMode('cancel')}>Cancel booking</button>
          </div>
        )}

        {mode === 'cancel' && (
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="adm-reason">Reason (optional)</label>
            <input id="adm-reason" className={input} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-gray-600 mt-2"><input type="checkbox" checked={silent} onChange={(e) => setSilent(e.target.checked)} /> Do not email the customer</label>
            <div className="flex gap-2 mt-3">
              <button type="button" className={btnPrimary} disabled={busy} onClick={() => run(() => api.post(`/admin/bookings/${id}/cancel`, { reason, silent }), 'Booking cancelled.')}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</button>
              <button type="button" className={btnGhost} onClick={() => setMode('view')}>Back</button>
            </div>
          </div>
        )}

        {mode === 'reschedule' && (
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="adm-date">New date</label>
            <input id="adm-date" className={input} type="date" min={todayIn()} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} />
            {loadingSlots && <p className="text-xs text-gray-500 mt-2">Loading times…</p>}
            {date && !loadingSlots && slots.error && <p className="text-xs text-rose-700 mt-2">{slots.error}</p>}
            {date && !loadingSlots && !slots.error && (
              <>
                <label className="block text-xs font-semibold text-gray-600 mt-3 mb-1" htmlFor="adm-time">New time</label>
                <select id="adm-time" className={input} value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">Select a time…</option>
                  {slots.list.map((s) => <option key={s.startTime} value={s.startTime}>{formatTime(s.startTime)} – {formatTime(s.endTime)}</option>)}
                </select>
                {!slots.list.length && <p className="text-xs text-gray-500 mt-2">No free times on this date.</p>}
              </>
            )}
            <label className="flex items-center gap-2 text-xs text-gray-600 mt-3"><input type="checkbox" checked={silent} onChange={(e) => setSilent(e.target.checked)} /> Do not email the customer</label>
            <div className="flex gap-2 mt-3">
              <button type="button" className={btnPrimary} disabled={busy || !time} onClick={() => run(() => api.post(`/admin/bookings/${id}/reschedule`, { date, startTime: time, silent }), 'Booking rescheduled.')}>{busy ? 'Saving…' : 'Confirm new time'}</button>
              <button type="button" className={btnGhost} onClick={() => setMode('view')}>Back</button>
            </div>
          </div>
        )}

        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email status</h3>
        <ul className="text-xs text-gray-600 mb-5 space-y-1">
          {Object.entries(booking.notifications || {}).map(([k, v]) => <li key={k}>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}: <strong>{v.status}</strong>{v.error ? ` (${v.error})` : ''}</li>)}
        </ul>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">History</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          {(booking.history || []).slice().reverse().map((h, i) => <li key={i}>{new Date(h.at).toLocaleString()} · {h.action} · {h.by}{h.detail ? ` · ${h.detail}` : ''}</li>)}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Settings, holidays and blocks ---------------- */
function SettingsTab({ say }) {
  const [s, setS] = useState(null);
  const [errors, setErrors] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [holiday, setHoliday] = useState('');
  const [block, setBlock] = useState({ type: 'date', date: '', startTime: '09:30', endTime: '10:00', reason: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/admin/bookings/settings'), api.get(`/admin/bookings/blocks?from=${todayIn()}`)])
      .then(([a, b]) => { if (alive) { setS(a.settings); setBlocks(b.blocks); } })
      .catch((err) => say(err.message, 'error'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const set = useCallback((k, v) => setS((cur) => ({ ...cur, [k]: v })), []);
  if (!s) return <div className="text-sm text-gray-500">Loading settings…</div>;

  const save = async () => {
    setSaving(true); setErrors({});
    try {
      const r = await api.put('/admin/bookings/settings', s);
      setS(r.settings); say('Settings saved.');
    } catch (err) {
      say(err.message, 'error');
      setErrors(err.fields || {});
    } finally { setSaving(false); }
  };
  const addBlock = async () => {
    try { await api.post('/admin/bookings/blocks', block); say('Time blocked.'); setReloadKey((n) => n + 1); } catch (err) { say(err.message, 'error'); }
  };
  const removeBlock = async (id) => {
    try { await api.delete(`/admin/bookings/blocks/${id}`); say('Block removed.'); setReloadKey((n) => n + 1); } catch (err) { say(err.message, 'error'); }
  };
  const num = (k) => (e) => set(k, e.target.value === '' ? '' : Number(e.target.value));
  const err = (k) => (errors[k] ? <div className="text-xs text-rose-700 mt-1">{errors[k]}</div> : null);
  const types = s.appointmentTypes || [];
  const setType = (i, patch) => set('appointmentTypes', types.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4" aria-label="Business hours">
        <h2 className="text-sm font-extrabold text-gray-900">Business hours ({s.timezone})</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.bookingEnabled} onChange={(e) => set('bookingEnabled', e.target.checked)} /> Online booking enabled</label>
        <fieldset><legend className="text-xs font-semibold text-gray-600 mb-1">Working days</legend>
          <div className="flex flex-wrap gap-3">{DAYS.map(([n, label]) => (
            <label key={n} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={s.workingDays.includes(n)} onChange={(e) => set('workingDays', e.target.checked ? [...s.workingDays, n].sort() : s.workingDays.filter((d) => d !== n))} />{label}</label>
          ))}</div>{err('workingDays')}
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-open">Opening time</label><input id="s-open" className={input} type="time" value={s.openingTime} onChange={(e) => set('openingTime', e.target.value)} />{err('openingTime')}</div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-close">Closing time</label><input id="s-close" className={input} type="time" value={s.closingTime} onChange={(e) => set('closingTime', e.target.value)} />{err('closingTime')}</div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-ls">Lunch starts</label><input id="s-ls" className={input} type="time" value={s.lunchBreak.start} onChange={(e) => set('lunchBreak', { ...s.lunchBreak, start: e.target.value })} /></div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-le">Lunch ends</label><input id="s-le" className={input} type="time" value={s.lunchBreak.end} onChange={(e) => set('lunchBreak', { ...s.lunchBreak, end: e.target.value })} /></div>
        </div>{err('lunchBreak')}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-dur">Appointment length (min)</label><input id="s-dur" className={input} type="number" step="15" min="15" value={s.appointmentDurationMinutes} onChange={num('appointmentDurationMinutes')} />{err('appointmentDurationMinutes')}</div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-int">Start every (min)</label><input id="s-int" className={input} type="number" step="15" min="15" value={s.slotIntervalMinutes} onChange={num('slotIntervalMinutes')} />{err('slotIntervalMinutes')}</div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-notice">Minimum notice (min)</label><input id="s-notice" className={input} type="number" min="0" value={s.minAdvanceNoticeMinutes} onChange={num('minAdvanceNoticeMinutes')} />{err('minAdvanceNoticeMinutes')}</div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-win">Booking window (days)</label><input id="s-win" className={input} type="number" min="1" value={s.maxAdvanceDays} onChange={num('maxAdvanceDays')} />{err('maxAdvanceDays')}</div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-cx">Cancel up to (hours before)</label><input id="s-cx" className={input} type="number" min="0" value={s.cancellationNoticeHours} onChange={num('cancellationNoticeHours')} />{err('cancellationNoticeHours')}</div>
          <div><label className="text-xs font-semibold text-gray-600" htmlFor="s-mail">Notify email</label><input id="s-mail" className={input} type="email" placeholder="default: info@…" value={s.adminNotificationEmail || ''} onChange={(e) => set('adminNotificationEmail', e.target.value)} />{err('adminNotificationEmail')}</div>
        </div>
        <fieldset><legend className="text-xs font-semibold text-gray-600 mb-1">Appointment types</legend>
          {types.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 mb-2 items-center">
              <input className={input} aria-label="Type label" value={t.label} onChange={(e) => setType(i, { label: e.target.value })} />
              <input className={input} aria-label="Minutes" type="number" step="15" min="15" value={t.durationMinutes} onChange={(e) => setType(i, { durationMinutes: Number(e.target.value) })} />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={t.enabled !== false} onChange={(e) => setType(i, { enabled: e.target.checked })} />On</label>
            </div>
          ))}
          <button type="button" className={btnGhost} onClick={() => set('appointmentTypes', [...types, { id: `type-${types.length + 1}`, label: 'New appointment type', durationMinutes: 30, enabled: true }])}>Add type</button>{err('appointmentTypes')}
        </fieldset>
        <button type="button" className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
      </section>

      <div className="space-y-5">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" aria-label="Holidays">
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">Holidays (closed all day)</h2>
          <div className="flex gap-2 mb-3"><input className={input} type="date" aria-label="Holiday date" value={holiday} onChange={(e) => setHoliday(e.target.value)} />
            <button type="button" className={btnGhost} disabled={!holiday} onClick={() => { set('holidays', [...new Set([...(s.holidays || []), holiday])].sort()); setHoliday(''); }}>Add</button></div>
          <ul className="flex flex-wrap gap-2">{(s.holidays || []).map((d) => (
            <li key={d} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs flex items-center gap-2">{formatShortDate(d)}
              <button type="button" aria-label={`Remove ${d}`} onClick={() => set('holidays', s.holidays.filter((x) => x !== d))} className="text-gray-500 hover:text-rose-700">×</button></li>
          ))}</ul>
          <p className="text-xs text-gray-500 mt-2">Add or remove dates, then press Save settings.</p>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" aria-label="Blocked time">
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">Block a date or time</h2>
          <div className="grid grid-cols-2 gap-3">
            <select className={input} aria-label="Block type" value={block.type} onChange={(e) => setBlock({ ...block, type: e.target.value })}><option value="date">Whole day</option><option value="slot">Time range</option></select>
            <input className={input} type="date" aria-label="Block date" min={todayIn()} value={block.date} onChange={(e) => setBlock({ ...block, date: e.target.value })} />
            {block.type === 'slot' && (<><input className={input} type="time" aria-label="Block from" value={block.startTime} onChange={(e) => setBlock({ ...block, startTime: e.target.value })} /><input className={input} type="time" aria-label="Block until" value={block.endTime} onChange={(e) => setBlock({ ...block, endTime: e.target.value })} /></>)}
            <input className={`${input} col-span-2`} placeholder="Reason (optional)" aria-label="Reason" maxLength={200} value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })} />
          </div>
          <button type="button" className={`${btnPrimary} mt-3`} disabled={!block.date} onClick={addBlock}>Block</button>
          <ul className="mt-4 divide-y divide-gray-100 text-sm">
            {!blocks.length && <li className="py-2 text-gray-500">No blocked dates or times.</li>}
            {blocks.map((b) => (
              <li key={b.id} className="py-2 flex items-center justify-between gap-3">
                <span>{formatShortDate(b.localDate)} · {b.type === 'date' ? 'Whole day' : `${new Date(b.startAtUtc).toLocaleTimeString('en-US', { timeZone: s.timezone, hour: 'numeric', minute: '2-digit' })} – ${new Date(b.endAtUtc).toLocaleTimeString('en-US', { timeZone: s.timezone, hour: 'numeric', minute: '2-digit' })}`}{b.reason ? ` · ${b.reason}` : ''}</span>
                <button type="button" className={btnGhost} onClick={() => removeBlock(b.id)}>Remove</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
