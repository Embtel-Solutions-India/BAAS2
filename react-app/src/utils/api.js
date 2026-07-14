// Configurable via Vite env (VITE_API_URL); defaults to the local dev server
// so existing behaviour is unchanged when the var is not set.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Build an absolute URL to a backend endpoint for direct browser navigation
// (file downloads, CSV exports) that can't go through fetch/credentials JSON.
export function apiUrl(path = '') {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(API_BASE + endpoint, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (res.status === 401) {
    if (!window.location.pathname.endsWith('/login') && !window.location.pathname.endsWith('/register')) {
      const isAdmin = window.location.pathname.startsWith('/admin');
      window.location.href = isAdmin ? '/admin/login' : '/client-portal/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get:    (url)          => apiFetch(url),
  post:   (url, body)    => apiFetch(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body)    => apiFetch(url, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (url, body)    => apiFetch(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)          => apiFetch(url, { method: 'DELETE' }),
  upload: (url, formData, method = 'POST') => fetch(API_BASE + url, {
    method,
    credentials: 'include',
    body: formData
  }).then(async r => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Upload failed');
    return data;
  })
};

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

export function statusBadge(status) {
  const labels = {
    pending:    'Pending',
    in_review:  'In Review',
    processing: 'Processing',
    submitted:  'Submitted',
    approved:   'Approved',
    completed:  'Completed',
    cancelled:  'Cancelled',
    paid:       'Paid',
    overdue:    'Overdue',
    sent:       'Sent',
    draft:      'Draft',
    unpaid:     'Unpaid',
    failed:     'Failed',
    refunded:   'Refunded'
  };
  return labels[status] || status;
}

export function statusBadgeClass(status) {
  return `badge badge-${status}`;
}
