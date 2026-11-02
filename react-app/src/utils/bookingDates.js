// Date helpers for the booking calendar. Dates are plain "YYYY-MM-DD" strings that mean a calendar date in the
// business timezone (America/Los_Angeles). Nothing here uses the browser's own timezone to decide what is open:
// the server decides availability, and these helpers only lay out and label what the server returned.
export const BUSINESS_TZ = 'America/Los_Angeles';

const pad = (n) => String(n).padStart(2, '0');
const utcNoon = (dateStr) => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };
const fmtDate = (dt) => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;

// Today's date in the business timezone, whatever the visitor's device is set to.
export function todayIn(tz = BUSINESS_TZ, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export const monthOf = (dateStr) => dateStr.slice(0, 7);

export function addDays(dateStr, n) {
  const dt = utcNoon(dateStr);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmtDate(dt);
}

export function addMonths(month, n) {
  const [y, m] = month.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}`;
}

// Weeks (Sunday first) of a month; days outside the month are null.
export function monthGrid(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1, 12));
  const days = new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
  const cells = Array.from({ length: first.getUTCDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const monthTitle = (month) => utcNoon(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const formatLongDate = (dateStr) => utcNoon(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
export const formatShortDate = (dateStr) => utcNoon(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
export const dayNumber = (dateStr) => Number(dateStr.slice(8, 10));

// "09:30" -> "9:30 AM"
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

// "PST" or "PDT" for a calendar date (noon is the same day in Los Angeles).
export function zoneAbbreviation(dateStr, tz = BUSINESS_TZ) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(`${dateStr}T20:00:00Z`));
  return (parts.find((p) => p.type === 'timeZoneName') || {}).value || '';
}

export const zoneLabel = (dateStr, tz = BUSINESS_TZ) => `${zoneAbbreviation(dateStr, tz)} (Los Angeles time)`;

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Weeks of a month with Monday first (the layout of the two-month booking calendar).
export function monthGridMonday(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1, 12));
  const days = new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
  const cells = Array.from({ length: (first.getUTCDay() + 6) % 7 }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const WEEKDAYS_MONDAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Same day number in another month, clamped to that month's length (Jan 31 + 1 month = Feb 28).
export function shiftMonth(dateStr, n) {
  const month = addMonths(dateStr.slice(0, 7), n);
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
  return `${month}-${pad(Math.min(Number(dateStr.slice(8, 10)), last))}`;
}

// 'Fri, Oct 30'
export const formatPillDate = (dateStr) => utcNoon(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
