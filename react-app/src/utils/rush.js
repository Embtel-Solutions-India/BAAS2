// Helpers for the Rush Service pages: analytics events (spec section 11) and Pacific-Time
// business-day math (used for the "within 1 business day" warning and days-to-deadline).

// ---- Analytics -----------------------------------------------------------------------------
// Fires a GA4 / gtag event. Never throws, and does nothing if the tag isn't loaded.
export function trackRush(name, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch { /* analytics must never break the page */ }
}

// ---- Pacific-Time dates --------------------------------------------------------------------
const PT = 'America/Los_Angeles';

// Today's date in Pacific Time as YYYY-MM-DD.
export function todayPT(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PT, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const toUTC = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUTC = (ms) => new Date(ms).toISOString().slice(0, 10);
const isWeekend = (iso) => { const day = new Date(toUTC(iso)).getUTCDay(); return day === 0 || day === 6; };

// The next business day (Mon–Fri) strictly after `iso`. Federal holidays are not excluded here.
export function nextBusinessDay(iso) {
  let ms = toUTC(iso);
  do { ms += 86400000; } while (isWeekend(fromUTC(ms)));
  return fromUTC(ms);
}

// Calendar days from today (PT) to the deadline.
export function daysToDeadline(deadlineISO, today = todayPT()) {
  return Math.round((toUTC(deadlineISO) - toUTC(today)) / 86400000);
}

// True when the deadline is today or the next business day (the "may need Emergency" warning).
export function isWithinOneBusinessDay(deadlineISO, today = todayPT()) {
  if (!deadlineISO) return false;
  return deadlineISO <= nextBusinessDay(today);
}

// ---- Tracking params captured by the request form (hidden fields) ------------------------
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];
const STORE_KEY = 'rush_utm';

// Remember UTM values from the landing URL for the rest of the visit (try/catch: storage may be blocked).
export function captureUtm() {
  try {
    const q = new URLSearchParams(window.location.search);
    const found = {};
    UTM_KEYS.forEach((k) => { if (q.get(k)) found[k] = q.get(k).slice(0, 100); });
    if (Object.keys(found).length) sessionStorage.setItem(STORE_KEY, JSON.stringify(found));
  } catch { /* ignore */ }
}

export function readUtm() {
  const out = { utm_source: '', utm_medium: '', utm_campaign: '' };
  try {
    const q = new URLSearchParams(window.location.search);
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
    UTM_KEYS.forEach((k) => { out[k] = (q.get(k) || saved[k] || '').slice(0, 100); });
  } catch { /* ignore */ }
  return out;
}
