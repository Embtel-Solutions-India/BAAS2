import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatCurrency, formatDate } from '../../utils/api';

const BLANK = {
  name: '', category: '', short_description: '', full_description: '',
  price: '', discount_price: '', state_fee: '', turnaround_days: '', duration: '',
  features: '', benefits: '', meta_title: '', meta_description: '', is_active: true,
};

function toForm(s) {
  return {
    name: s.name || '', category: s.category || '',
    short_description: s.short_description || s.description || '',
    full_description: s.full_description || '',
    price: s.price ?? '', discount_price: s.discount_price ?? '',
    state_fee: s.state_fee ?? '', turnaround_days: s.turnaround_days ?? '',
    duration: s.duration || '',
    features: (s.features || []).join('\n'), benefits: (s.benefits || []).join('\n'),
    meta_title: s.meta_title || '', meta_description: s.meta_description || '',
    is_active: s.is_active !== false,
  };
}

export default function AdminServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, unavailable: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // modal: { mode: 'create'|'edit'|'view'|'delete', service } | null
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [thumb, setThumb] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const page = Number(searchParams.get('page') || 1);
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', String(page));
      params.set('limit', '25');
      const data = await api.get(`/admin/services?${params.toString()}`);
      setServices(data.services || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 1 });
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => { load(); }, [load]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };
  const handleSearch = (e) => { e.preventDefault(); setParam('search', searchInput); };

  const openCreate = () => { setForm(BLANK); setThumb(null); setFormError(''); setModal({ mode: 'create' }); };
  const openEdit = (s) => { setForm(toForm(s)); setThumb(null); setFormError(''); setModal({ mode: 'edit', service: s }); };
  const openView = async (s) => {
    setModal({ mode: 'view', service: s });
    try { const d = await api.get(`/admin/services/${s.id}`); setModal({ mode: 'view', service: d.service }); } catch { /* keep row data */ }
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveForm = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) { setFormError('A valid price is required.'); return; }
    if (form.discount_price !== '' && Number(form.discount_price) > Number(form.price)) { setFormError('Discount price cannot exceed the price.'); return; }

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('category', form.category.trim() || 'General');
    fd.append('short_description', form.short_description);
    fd.append('full_description', form.full_description);
    fd.append('price', String(form.price));
    if (form.discount_price !== '') fd.append('discount_price', String(form.discount_price));
    else fd.append('discount_price', '');
    fd.append('state_fee', form.state_fee === '' ? '0' : String(form.state_fee));
    fd.append('turnaround_days', form.turnaround_days === '' ? '5' : String(form.turnaround_days));
    fd.append('duration', form.duration);
    fd.append('features', form.features);
    fd.append('benefits', form.benefits);
    fd.append('meta_title', form.meta_title);
    fd.append('meta_description', form.meta_description);
    fd.append('is_active', String(form.is_active));
    if (thumb) fd.append('thumbnail', thumb);

    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        await api.upload(`/admin/services/${modal.service.id}`, fd, 'PUT');
        setNotice('Product updated.');
      } else {
        await api.upload('/admin/services', fd, 'POST');
        setNotice('Product created.');
      }
      setModal(null);
      await load();
    } catch (err) {
      setFormError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (s) => {
    try {
      await api.patch(`/admin/services/${s.id}/availability`, { is_active: !s.is_active });
      setNotice(`"${s.name}" marked ${!s.is_active ? 'Available' : 'Not Available'}.`);
      await load();
    } catch (err) { setError(err.message); }
  };

  const confirmDelete = async () => {
    try {
      const r = await api.delete(`/admin/services/${modal.service.id}`);
      setNotice(r.message || 'Product removed.');
      setModal(null);
      await load();
    } catch (err) { setFormError(err.message); }
  };

  const priceCell = (s) => s.discount_price != null
    ? <span>{formatCurrency(s.discount_price)} <span className="text-gray-400 line-through text-[11px]">{formatCurrency(s.price)}</span></span>
    : formatCurrency(s.price);

  return (
    <AdminLayout title="Product & Service Management">
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium border bg-rose-50 border-rose-100 text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 ml-3">&times;</button>
        </div>
      )}
      {notice && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium border bg-emerald-50 border-emerald-100 text-emerald-700 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-emerald-600 ml-3">&times;</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Products" value={stats.total} color="text-gray-900" />
        <StatCard label="Available" value={stats.available} color="text-emerald-600" />
        <StatCard label="Not Available" value={stats.unavailable} color="text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-gray-900">All Products &amp; Services</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <form onSubmit={handleSearch}>
              <input
                type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name, category…"
                className="w-56 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] focus:ring-2 focus:ring-rose-500/10 transition-all"
              />
            </form>
            <select
              value={statusFilter} onChange={e => setParam('status', e.target.value === 'all' ? '' : e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Not Available</option>
            </select>
            <button onClick={openCreate}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#d4001f] hover:bg-[#a4001a] text-white shadow-xs transition-all">
              + Add Product
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-gray-400 mb-4">No products yet. Create your first product or service.</p>
            <button onClick={openCreate} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#d4001f] hover:bg-[#a4001a] text-white">+ Add Product</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/30">
                  {['Name', 'Category', 'Price', 'Status', 'Created', 'Updated', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-gray-800">{s.name}</div>
                      {s.short_description && <div className="text-[10px] text-gray-400 max-w-xs truncate">{s.short_description}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.category || '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">{priceCell(s)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {s.is_active ? 'Available' : 'Not Available'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        <button onClick={() => openView(s)} className="px-2 py-1 rounded-md text-[10px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50">View</button>
                        <button onClick={() => openEdit(s)} className="px-2 py-1 rounded-md text-[10px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50">Edit</button>
                        <button onClick={() => toggleAvailability(s)} className={`px-2 py-1 rounded-md text-[10px] font-bold border ${s.is_active ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                          {s.is_active ? 'Mark N/A' : 'Mark Available'}
                        </button>
                        <button onClick={() => { setFormError(''); setModal({ mode: 'delete', service: s }); }} className="px-2 py-1 rounded-md text-[10px] font-bold border border-rose-200 text-rose-700 hover:bg-rose-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setParam('page', String(p))}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${p === pagination.page ? 'bg-[#d4001f] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (modal.mode === 'create' || modal.mode === 'edit') && (
        <Modal onClose={() => setModal(null)} title={modal.mode === 'edit' ? 'Edit Product' : 'Add Product'}>
          <form onSubmit={saveForm} className="space-y-4">
            {formError && <div className="px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 border border-rose-100 text-rose-700">{formError}</div>}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *"><input className={inp} value={form.name} onChange={e => setF('name', e.target.value)} /></Field>
              <Field label="Category"><input className={inp} value={form.category} onChange={e => setF('category', e.target.value)} placeholder="e.g. Formation" /></Field>
            </div>
            <Field label="Short description"><input className={inp} value={form.short_description} onChange={e => setF('short_description', e.target.value)} /></Field>
            <Field label="Full description"><textarea className={inp} rows={3} value={form.full_description} onChange={e => setF('full_description', e.target.value)} /></Field>

            <div className="grid grid-cols-4 gap-3">
              <Field label="Price ($) *"><input type="number" step="0.01" className={inp} value={form.price} onChange={e => setF('price', e.target.value)} /></Field>
              <Field label="Discount ($)"><input type="number" step="0.01" className={inp} value={form.discount_price} onChange={e => setF('discount_price', e.target.value)} /></Field>
              <Field label="State fee ($)"><input type="number" step="0.01" className={inp} value={form.state_fee} onChange={e => setF('state_fee', e.target.value)} /></Field>
              <Field label="Turnaround (days)"><input type="number" className={inp} value={form.turnaround_days} onChange={e => setF('turnaround_days', e.target.value)} /></Field>
            </div>

            <Field label="Duration (optional)"><input className={inp} value={form.duration} onChange={e => setF('duration', e.target.value)} placeholder="e.g. 1 year, per month" /></Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Features (one per line)"><textarea className={inp} rows={3} value={form.features} onChange={e => setF('features', e.target.value)} /></Field>
              <Field label="Benefits (one per line)"><textarea className={inp} rows={3} value={form.benefits} onChange={e => setF('benefits', e.target.value)} /></Field>
            </div>

            <Field label="Thumbnail image (optional, JPG/PNG/WEBP ≤ 5MB)">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setThumb(e.target.files[0] || null)} className="text-xs" />
              {modal.mode === 'edit' && modal.service.thumbnail && !thumb && (
                <div className="mt-2"><img src={modal.service.thumbnail} alt="" className="h-14 rounded border border-gray-200" /></div>
              )}
            </Field>

            <details className="border border-gray-100 rounded-lg p-3">
              <summary className="text-xs font-bold text-gray-500 cursor-pointer">SEO (optional)</summary>
              <div className="mt-3 space-y-3">
                <Field label="Meta title"><input className={inp} value={form.meta_title} onChange={e => setF('meta_title', e.target.value)} /></Field>
                <Field label="Meta description"><textarea className={inp} rows={2} value={form.meta_description} onChange={e => setF('meta_description', e.target.value)} /></Field>
              </div>
            </details>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={form.is_active} onChange={e => setF('is_active', e.target.checked)} />
              Available (visible &amp; purchasable on the client site)
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#d4001f] hover:bg-[#a4001a] text-white disabled:opacity-50">
                {saving ? 'Saving…' : modal.mode === 'edit' ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View modal */}
      {modal && modal.mode === 'view' && (
        <Modal onClose={() => setModal(null)} title={modal.service.name}>
          <div className="space-y-2 text-sm">
            {modal.service.thumbnail && <img src={modal.service.thumbnail} alt="" className="h-24 rounded-lg border border-gray-200 mb-2" />}
            <Row k="Category" v={modal.service.category || '—'} />
            <Row k="Status" v={modal.service.is_active ? 'Available' : 'Not Available'} />
            <Row k="Price" v={formatCurrency(modal.service.price)} />
            {modal.service.discount_price != null && <Row k="Discount price" v={formatCurrency(modal.service.discount_price)} />}
            {(modal.service.state_fee || 0) > 0 && <Row k="State fee" v={formatCurrency(modal.service.state_fee)} />}
            {modal.service.duration && <Row k="Duration" v={modal.service.duration} />}
            {modal.service.short_description && <Row k="Short description" v={modal.service.short_description} />}
            {modal.service.full_description && <Row k="Full description" v={modal.service.full_description} />}
            {(modal.service.features || []).length > 0 && <Row k="Features" v={modal.service.features.join(', ')} />}
            {(modal.service.benefits || []).length > 0 && <Row k="Benefits" v={modal.service.benefits.join(', ')} />}
            {modal.service.order_count != null && <Row k="Existing orders" v={String(modal.service.order_count)} />}
            <Row k="Created" v={formatDate(modal.service.created_at)} />
            <Row k="Last updated" v={formatDate(modal.service.updated_at)} />
            <div className="flex justify-end pt-3">
              <button onClick={() => openEdit(modal.service)} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#d4001f] hover:bg-[#a4001a] text-white">Edit</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {modal && modal.mode === 'delete' && (
        <Modal onClose={() => setModal(null)} title="Delete Product">
          {formError && <div className="mb-3 px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 border border-rose-100 text-rose-700">{formError}</div>}
          <p className="text-sm text-gray-600">Remove <strong>{modal.service.name}</strong> from the catalog? It will no longer be visible or purchasable. Any existing orders that reference it stay intact (soft delete).</p>
          <div className="flex items-center justify-end gap-2 pt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">Delete</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#d4001f] focus:ring-2 focus:ring-rose-500/10';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 text-sm">
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className="font-medium text-gray-800 text-right">{v}</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className={`text-2xl font-bold tracking-tight font-serif mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
