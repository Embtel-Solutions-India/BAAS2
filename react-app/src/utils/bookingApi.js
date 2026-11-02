import { API_BASE } from './api';

// Public booking API client. The server is the authority on availability: cached answers only make the
// calendar feel fast, and the server checks everything again when a booking is submitted.
export class BookingApiError extends Error {
  constructor(message, { status = 0, code = '', fields = null } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}/bookings${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new BookingApiError('We could not reach the booking service. Check your connection and try again.', { code: 'NETWORK' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new BookingApiError(data.error || 'Something went wrong. Please try again.', { status: res.status, code: data.code || '', fields: data.fields || null });
  return data;
}

// ---- short-lived cache (60 s for months, 30 s for days), with shared in-flight requests ----
const TTL = { month: 60000, day: 30000 };
const cache = new Map();
const inflight = new Map();

function cached(key, ttl, loader, force) {
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data);
  if (!force && inflight.has(key)) return inflight.get(key);
  const p = loader()
    .then((data) => { cache.set(key, { data, at: Date.now() }); return data; })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Call after a booking is created, cancelled or rescheduled.
export const invalidateAvailability = () => { cache.clear(); };

let configPromise = null;
export const getBookingConfig = () => {
  if (!configPromise) configPromise = request('/config').catch((err) => { configPromise = null; throw err; });
  return configPromise;
};

export const getAvailableDates = (month, { force = false } = {}) => cached(`m:${month}`, TTL.month, () => request(`/available-dates?month=${encodeURIComponent(month)}`), force);
export const getAvailableSlots = (date, { force = false } = {}) => cached(`d:${date}`, TTL.day, () => request(`/available-slots?date=${encodeURIComponent(date)}`), force);

export async function createBooking(payload) {
  const res = await request('/', { method: 'POST', body: payload });
  invalidateAvailability();
  return res;
}
export const getBooking = (reference, token) => request(`/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`);
export async function cancelBooking(reference, token, reason = '') {
  const res = await request(`/${encodeURIComponent(reference)}/cancel`, { method: 'POST', body: { token, reason } });
  invalidateAvailability();
  return res;
}
export async function rescheduleBooking(reference, token, date, startTime) {
  const res = await request(`/${encodeURIComponent(reference)}/reschedule`, { method: 'POST', body: { token, date, startTime } });
  invalidateAvailability();
  return res;
}

// A fresh key per slot choice: retrying the same submission can never create a second booking.
export function newIdempotencyKey() {
  try { if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID(); } catch { /* fall through */ }
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
