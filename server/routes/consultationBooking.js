const router = require('express').Router();
const rateLimit = require('express-rate-limit');

/**
 * Consultation booking relay ("BAAS Consultation Booking: API Requests and Responses", October 2026).
 * The website never calls the n8n links from the browser: these routes do it server to server, so the links stay
 * private and the browser only ever talks to our own API. n8n owns the calendar, the CRM and the emails; this file
 * only checks the shape of what is sent, forwards it, and passes n8n's JSON (and status code) back unchanged.
 *
 *   GET  /api/booking/availability              -> baas-free-slots
 *   POST /api/booking                           -> baas-consultation
 *   GET  /api/booking/confirmation/:bookingId   -> baas-booking-confirmation?booking_id=
 *   POST /api/booking/cancel                    -> baas-booking-cancel
 *   POST /api/booking/reschedule                -> baas-booking-reschedule
 *   GET  /api/booking/services                  -> fixed list (no n8n call)
 */
const N8N_BASE = (process.env.N8N_BOOKING_BASE || 'https://n8n.embtelsolutions.ca/webhook').replace(/\/$/, '');
const TIMEOUT_MS = 25000;

const SESSION = { name: 'Free 1-to-1 Session', duration_minutes: 30, price: 0, timezone: 'America/Los_Angeles' };
// These exact values are sent back to n8n by the booking call, so they must not be reworded.
const SERVICES = [
  'Bookkeeping & Accounting',
  'Business & Individual Taxes',
  'Payroll Management',
  'Accounting Cleanup',
  'Business Formation & Consulting',
  'Registered Agent Services',
  'Bookkeeping Cleanup & Catch-Up',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+[1-9]\d{7,14}$/;
const ID_RE = /^[A-Za-z0-9_-]{6,128}$/;
// start_time must be sent exactly as it came from the availability list, e.g. 2026-11-03T10:00:00-08:00. Only its shape is checked here.
const START_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'referrer'];

const readLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.BOOKING_READ_LIMIT) || 300, message: { success: false, message: 'Too many requests. Please try again shortly.' }, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.BOOKING_WRITE_LIMIT) || 12, message: { success: false, message: 'Too many booking attempts. Please try again later or call (510) 962-7300.' }, standardHeaders: true, legacyHeaders: false });

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const noStore = (res) => res.set('Cache-Control', 'no-store');
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// Call n8n and hand its answer back. Any non-JSON or unreachable answer becomes a clean 502 with no internals.
async function relay(res, path, { method = 'GET', body, onEmptyOk } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(`${N8N_BASE}/${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    if ((!data || typeof data !== 'object') && upstream.ok && !text.trim() && onEmptyOk) return await onEmptyOk();
    if (!data || typeof data !== 'object') {
      console.error(`[booking] n8n ${path} returned ${upstream.status} with a non-JSON body`);
      return fail(res, 502, 'Sorry, we could not complete that right now. Please try again or contact us at (510) 962-7300.');
    }
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error(`[booking] n8n ${path} failed:`, err && err.name === 'AbortError' ? 'timed out' : err && err.message);
    return fail(res, 502, 'Sorry, we could not complete that right now. Please try again or contact us at (510) 962-7300.');
  } finally {
    clearTimeout(timer);
  }
}


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOOKING_PENDING_MESSAGE = 'We could not confirm your booking yet. Please check your email in a few minutes, or call (510) 962-7300, before booking again.';

// The booking system should answer a booking with JSON (see the guide), but it has answered 200 with an EMPTY body
// even when the booking was created. Telling the visitor "failed" would make them book again, so when the body is
// empty we look at the free list: if the chosen time is gone the booking went through, and we say so (without a
// booking id, which only the booking system knows). If the time is still free we say it is unconfirmed, never "failed".
async function recoverEmptyBookingReply(res, startTime) {
  let list = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep(1200);
    try {
      const r = await fetch(`${N8N_BASE}/baas-free-slots`, { headers: { Accept: 'application/json' } });
      const j = await r.json();
      if (j && Array.isArray(j.days)) {
        list = j;
        if (!j.days.some((d) => (d.slots || []).includes(startTime))) break; // gone: the booking went through
      }
    } catch { /* try again */ }
  }
  if (!list) return fail(res, 502, 'Sorry, we could not complete that right now. Please try again or contact us at (510) 962-7300.');
  const gone = !list.days.some((d) => (d.slots || []).includes(startTime));
  const common = { timezone: list.timezone || SESSION.timezone, generated_at: list.generated_at || new Date().toISOString(), days: list.days, booking_id: '', meeting_link: '' };
  console.warn(`[booking] n8n baas-consultation answered with an empty body; time is ${gone ? 'no longer free (booking assumed created)' : 'still free (unconfirmed)'}`);
  return gone
    ? res.status(200).json({ success: true, message: 'Your consultation is booked. A confirmation will be sent to your email.', booking_status: 'booked', appointment_start: startTime, confirmation_pending: true, ...common })
    : res.status(200).json({ success: false, message: BOOKING_PENDING_MESSAGE, booking_status: 'unconfirmed', appointment_start: '', ...common });
}

router.get('/services', readLimiter, (req, res) => {
  noStore(res);
  res.json({ session: SESSION, services: SERVICES });
});

router.get('/availability', readLimiter, (req, res) => {
  noStore(res);
  return relay(res, 'baas-free-slots');
});

router.post('/', writeLimiter, (req, res) => {
  const b = req.body || {};
  // Honeypot: people never fill this hidden field. Pretend nothing is wrong so bots move on.
  if (b.website) return fail(res, 200, 'Your consultation is booked.');

  const first = str(b.first_name, 80);
  const last = str(b.last_name, 80);
  const email = str(b.email, 200);
  const phone = str(b.phone, 30);
  const start = str(b.start_time, 40);
  if (!first || !last) return fail(res, 400, 'Please enter your first and last name.');
  if (!EMAIL_RE.test(email)) return fail(res, 400, 'Please enter a valid email address.');
  if (!PHONE_RE.test(phone)) return fail(res, 400, 'Please enter a phone number with the country code, for example +15105550123.');
  if (!START_RE.test(start)) return fail(res, 400, 'Please choose a time from the list.');

  if (b.services !== undefined && !Array.isArray(b.services)) return fail(res, 400, 'Please choose services from the list.');
  const services = b.services || [];
  if (services.length > SERVICES.length || services.some((s) => !SERVICES.includes(s))) return fail(res, 400, 'Please choose services from the list.');

  const payload = {
    first_name: first, last_name: last, email, phone, start_time: start,
    services: SERVICES.filter((s) => services.includes(s)),
    message: str(b.message, 1500).replace(/<[^>]*>/g, ' '),
  };
  // Optional text-message opt-in: only recorded when the visitor ticked the separate box.
  if (b.sms_consent === true) { payload.sms_consent = true; payload.sms_service_consent = b.sms_service_consent === true; payload.sms_marketing_consent = b.sms_marketing_consent === true; payload.sms_consent_text = str(b.sms_consent_text, 1500); }
  // Always all five tracking keys, empty when unknown.
  TRACKING_KEYS.forEach((k) => { payload[k] = str(b[k], 300); });
  noStore(res);
  return relay(res, 'baas-consultation', { method: 'POST', body: payload, onEmptyOk: () => recoverEmptyBookingReply(res, payload.start_time) });
});

router.get('/confirmation/:bookingId', readLimiter, (req, res) => {
  const id = req.params.bookingId;
  if (!ID_RE.test(id)) return fail(res, 400, 'booking_id is required.');
  noStore(res);
  return relay(res, `baas-booking-confirmation?booking_id=${encodeURIComponent(id)}`);
});

router.post('/cancel', writeLimiter, (req, res) => {
  const b = req.body || {};
  const id = str(b.booking_id, 128);
  const email = str(b.email, 200);
  if (!ID_RE.test(id) || !EMAIL_RE.test(email)) return fail(res, 400, 'booking_id and email are required.');
  noStore(res);
  return relay(res, 'baas-booking-cancel', { method: 'POST', body: { booking_id: id, email } });
});

router.post('/reschedule', writeLimiter, (req, res) => {
  const b = req.body || {};
  const id = str(b.booking_id, 128);
  const email = str(b.email, 200);
  const start = str(b.start_time, 40);
  if (!ID_RE.test(id) || !EMAIL_RE.test(email) || !start) return fail(res, 400, 'booking_id, email and start_time are required.');
  if (!START_RE.test(start)) return fail(res, 400, 'start_time must be one of the times from the availability list, sent exactly as received.');
  noStore(res);
  return relay(res, 'baas-booking-reschedule', { method: 'POST', body: { booking_id: id, email, start_time: start } });
});

module.exports = router;
