/**
 * Pure scheduling rules for the appointment booking system (no database, no Express).
 *
 * Every date is a calendar date in the BUSINESS timezone (America/Los_Angeles by default), written YYYY-MM-DD.
 * Every time is a wall-clock time in that same zone, written HH:mm. Dates and times are only turned into
 * instants (UTC Dates) here, with luxon, so daylight saving time is handled by the tz database and never by
 * hardcoded offsets. The browser's timezone is never used to decide availability.
 */
const { DateTime } = require('luxon');

const DEFAULT_TIMEZONE = 'America/Los_Angeles';
// Bookings reserve time in 15-minute cells (see slotKeys), so durations and intervals must be multiples of this.
const GRANULARITY_MINUTES = 15;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DEFAULT_SETTINGS = {
  timezone: DEFAULT_TIMEZONE,
  bookingEnabled: true,
  workingDays: [1, 2, 3, 4, 5], // ISO weekdays: 1 = Monday ... 7 = Sunday
  openingTime: '09:30',
  closingTime: '18:00',
  lunchBreak: { start: '11:30', end: '12:30' },
  appointmentDurationMinutes: 30,
  slotIntervalMinutes: 30,
  minAdvanceNoticeMinutes: 60,
  maxAdvanceDays: 90,
  cancellationNoticeHours: 24,
  holidays: [], // YYYY-MM-DD
  appointmentTypes: [{ id: 'consultation', label: '30-minute consultation', durationMinutes: 30, enabled: true }],
  adminNotificationEmail: '',
};

const isDateStr = (s) => typeof s === 'string' && DATE_RE.test(s) && DateTime.fromISO(s, { zone: 'utc' }).isValid;
const isMonthStr = (s) => typeof s === 'string' && MONTH_RE.test(s);
const isTimeStr = (s) => typeof s === 'string' && TIME_RE.test(s);

const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fromMinutes = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

// Settings stored in the database may be partial; anything missing falls back to the defaults.
function normalizeSettings(raw) {
  const r = raw && typeof raw.toObject === 'function' ? raw.toObject() : (raw || {});
  const s = { ...DEFAULT_SETTINGS, ...r };
  s.lunchBreak = { ...DEFAULT_SETTINGS.lunchBreak, ...(r.lunchBreak || {}) };
  s.workingDays = Array.isArray(r.workingDays) ? r.workingDays : DEFAULT_SETTINGS.workingDays;
  s.holidays = Array.isArray(r.holidays) ? r.holidays : [];
  s.appointmentTypes = Array.isArray(r.appointmentTypes) && r.appointmentTypes.length ? r.appointmentTypes : DEFAULT_SETTINGS.appointmentTypes;
  return s;
}

/**
 * Wall-clock time in `zone` -> instant. `issue` is 'nonexistent' (skipped by a spring-forward gap) or
 * 'ambiguous' (repeated by a fall-back) so callers can reject those times instead of guessing.
 */
function localToUtc(dateStr, hhmm, zone = DEFAULT_TIMEZONE) {
  const dt = DateTime.fromISO(`${dateStr}T${hhmm}`, { zone });
  if (!dt.isValid) return { utc: null, issue: 'invalid' };
  if (dt.toFormat('HH:mm') !== hhmm) return { utc: null, issue: 'nonexistent' };
  const hourLater = dt.plus({ hours: 1 });
  const hourEarlier = dt.minus({ hours: 1 });
  // luxon picks either copy of a repeated hour depending on today's offset, so look both ways
  const repeats = (o) => o.offset !== dt.offset && o.toFormat('HH:mm') === hhmm;
  if (repeats(hourLater) || repeats(hourEarlier)) return { utc: dt.toUTC().toJSDate(), issue: 'ambiguous' };
  return { utc: dt.toUTC().toJSDate(), issue: null };
}

// ISO weekday (1 = Monday ... 7 = Sunday) of a calendar date in the business zone.
const weekdayOf = (dateStr, zone = DEFAULT_TIMEZONE) => DateTime.fromISO(dateStr, { zone }).weekday;

// Today's calendar date in the business zone.
const todayInZone = (now = new Date(), zone = DEFAULT_TIMEZONE) => DateTime.fromJSDate(now, { zone }).toFormat('yyyy-LL-dd');

const addDays = (dateStr, days) => DateTime.fromISO(dateStr, { zone: 'utc' }).plus({ days }).toFormat('yyyy-LL-dd');

// [start of the local day, start of the next local day) as instants.
function dayRangeUtc(dateStr, zone = DEFAULT_TIMEZONE) {
  const start = DateTime.fromISO(dateStr, { zone }).startOf('day');
  return { start: start.toUTC().toJSDate(), end: start.plus({ days: 1 }).startOf('day').toUTC().toJSDate() };
}

function datesInMonth(monthStr) {
  const first = DateTime.fromISO(`${monthStr}-01`, { zone: 'utc' });
  return Array.from({ length: first.daysInMonth }, (_, i) => first.plus({ days: i }).toFormat('yyyy-LL-dd'));
}

// Every 15-minute cell a booking occupies. A unique index on these keys makes overlapping bookings impossible.
function slotKeysFor(startUtc, endUtc) {
  const keys = [];
  for (let t = startUtc.getTime(); t < endUtc.getTime(); t += GRANULARITY_MINUTES * 60000) keys.push(new Date(t).toISOString());
  return keys;
}

/**
 * Every possible appointment of `durationMinutes` on one day, from the opening hours, in order.
 * Slots that touch the lunch break are included but flagged, so callers can show or hide them.
 * Times that do not exist (or repeat) because of a daylight saving change are left out.
 */
function generateDaySlots(dateStr, settings, durationMinutes = settings.appointmentDurationMinutes) {
  const zone = settings.timezone;
  const open = toMinutes(settings.openingTime);
  const close = toMinutes(settings.closingTime);
  const lunchStart = toMinutes(settings.lunchBreak.start);
  const lunchEnd = toMinutes(settings.lunchBreak.end);
  const slots = [];
  for (let m = open; m + durationMinutes <= close; m += settings.slotIntervalMinutes) {
    const start = localToUtc(dateStr, fromMinutes(m), zone);
    const end = localToUtc(dateStr, fromMinutes(m + durationMinutes), zone);
    if (start.issue || end.issue) continue;
    slots.push({
      startTime: fromMinutes(m),
      endTime: fromMinutes(m + durationMinutes),
      startUtc: start.utc,
      endUtc: new Date(start.utc.getTime() + durationMinutes * 60000),
      lunch: m < lunchEnd && m + durationMinutes > lunchStart,
    });
  }
  return slots;
}

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

// Why a whole day cannot be booked, or '' when it can. Does not look at individual slots.
function dayClosedReason(dateStr, settings, now = new Date()) {
  if (!settings.bookingEnabled) return 'Online booking is currently unavailable';
  if (!isDateStr(dateStr)) return 'Invalid date';
  const today = todayInZone(now, settings.timezone);
  if (dateStr < today) return 'This date has passed';
  if (dateStr > addDays(today, settings.maxAdvanceDays)) return 'Too far in the future';
  if (!settings.workingDays.includes(weekdayOf(dateStr, settings.timezone))) return 'Closed on this day';
  if (settings.holidays.includes(dateStr)) return 'Closed for a holiday';
  return '';
}

/**
 * Slots for one date with their availability, given the existing bookings and admin blocks.
 * `bookings` / `blocks` only need { startAtUtc, endAtUtc }. This is the single source of truth: the public
 * availability endpoint and the booking endpoint both use it.
 */
function evaluateDay({ dateStr, settings, now = new Date(), bookings = [], blocks = [], durationMinutes, ignoreBookingId = null }) {
  const closed = dayClosedReason(dateStr, settings, now);
  if (closed) return { date: dateStr, dateAvailable: false, reason: closed, slots: [] };

  const earliest = now.getTime() + settings.minAdvanceNoticeMinutes * 60000;
  const slots = generateDaySlots(dateStr, settings, durationMinutes).map((slot) => {
    let reason = '';
    if (slot.lunch) reason = 'Lunch break';
    else if (slot.startUtc.getTime() < earliest) reason = 'Time has passed';
    else if (blocks.some((b) => overlaps(slot.startUtc, slot.endUtc, new Date(b.startAtUtc), new Date(b.endAtUtc)))) reason = 'Unavailable';
    else if (bookings.some((b) => String(b._id || b.id) !== String(ignoreBookingId) && overlaps(slot.startUtc, slot.endUtc, new Date(b.startAtUtc), new Date(b.endAtUtc)))) reason = 'Booked';
    return { ...slot, available: !reason, ...(reason ? { reason } : {}) };
  });
  return { date: dateStr, dateAvailable: slots.some((s) => s.available), reason: slots.some((s) => s.available) ? '' : 'Fully booked', slots };
}

/**
 * Validate an admin settings payload. Returns { errors: {field: message}, value }.
 * Only known keys are kept; the stored times are always HH:mm in the business timezone.
 */
function validateSettingsInput(input) {
  const errors = {};
  const v = {};
  const i = input || {};

  if (i.timezone !== undefined) {
    if (!DateTime.local().setZone(String(i.timezone)).isValid) errors.timezone = 'Unknown timezone.';
    else v.timezone = String(i.timezone);
  }
  if (i.bookingEnabled !== undefined) v.bookingEnabled = !!i.bookingEnabled;
  if (i.workingDays !== undefined) {
    const days = Array.isArray(i.workingDays) ? [...new Set(i.workingDays.map(Number))] : [];
    if (days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) errors.workingDays = 'Working days must be 1 (Monday) to 7 (Sunday).';
    else v.workingDays = days.sort();
  }
  for (const key of ['openingTime', 'closingTime']) {
    if (i[key] !== undefined) { if (!isTimeStr(i[key])) errors[key] = 'Use HH:mm, for example 09:30.'; else v[key] = i[key]; }
  }
  if (i.lunchBreak !== undefined) {
    const lb = i.lunchBreak || {};
    if (!isTimeStr(lb.start) || !isTimeStr(lb.end)) errors.lunchBreak = 'Lunch start and end must be HH:mm.';
    else if (toMinutes(lb.start) >= toMinutes(lb.end)) errors.lunchBreak = 'Lunch must end after it starts.';
    else v.lunchBreak = { start: lb.start, end: lb.end };
  }
  for (const key of ['appointmentDurationMinutes', 'slotIntervalMinutes']) {
    if (i[key] !== undefined) {
      const n = Number(i[key]);
      if (!Number.isInteger(n) || n < GRANULARITY_MINUTES || n > 240 || n % GRANULARITY_MINUTES) errors[key] = `Must be a multiple of ${GRANULARITY_MINUTES} minutes, up to 240.`;
      else v[key] = n;
    }
  }
  const intRule = (key, min, max) => {
    if (i[key] === undefined) return;
    const n = Number(i[key]);
    if (!Number.isInteger(n) || n < min || n > max) errors[key] = `Must be a whole number from ${min} to ${max}.`;
    else v[key] = n;
  };
  intRule('minAdvanceNoticeMinutes', 0, 60 * 24 * 14);
  intRule('maxAdvanceDays', 1, 365);
  intRule('cancellationNoticeHours', 0, 24 * 14);
  if (i.holidays !== undefined) {
    const list = Array.isArray(i.holidays) ? i.holidays : [];
    if (list.some((d) => !isDateStr(d))) errors.holidays = 'Holidays must be YYYY-MM-DD dates.';
    else v.holidays = [...new Set(list)].sort();
  }
  if (i.adminNotificationEmail !== undefined) {
    const e = String(i.adminNotificationEmail || '').trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) errors.adminNotificationEmail = 'Enter a valid email address.';
    else v.adminNotificationEmail = e;
  }
  if (i.appointmentTypes !== undefined) {
    const list = Array.isArray(i.appointmentTypes) ? i.appointmentTypes : [];
    const types = list.map((t) => ({
      id: String((t && t.id) || '').trim().slice(0, 40),
      label: String((t && t.label) || '').trim().slice(0, 80),
      durationMinutes: Number(t && t.durationMinutes),
      enabled: !t || t.enabled !== false,
    }));
    if (!types.length || types.some((t) => !/^[a-z0-9-]+$/.test(t.id) || !t.label || !Number.isInteger(t.durationMinutes) || t.durationMinutes < GRANULARITY_MINUTES || t.durationMinutes > 240 || t.durationMinutes % GRANULARITY_MINUTES)) {
      errors.appointmentTypes = `Each type needs a lowercase id, a label and a duration that is a multiple of ${GRANULARITY_MINUTES} minutes.`;
    } else if (new Set(types.map((t) => t.id)).size !== types.length) errors.appointmentTypes = 'Appointment type ids must be unique.';
    else if (!types.some((t) => t.enabled)) errors.appointmentTypes = 'Keep at least one appointment type enabled.';
    else v.appointmentTypes = types;
  }
  return { errors, value: v };
}

// Cross-field checks on the merged result (opening < closing, lunch inside the day).
function settingsConsistencyErrors(s) {
  const errors = {};
  if (toMinutes(s.openingTime) >= toMinutes(s.closingTime)) errors.closingTime = 'Closing time must be after opening time.';
  else if (toMinutes(s.lunchBreak.start) < toMinutes(s.openingTime) || toMinutes(s.lunchBreak.end) > toMinutes(s.closingTime)) errors.lunchBreak = 'Lunch must fall within opening hours.';
  return errors;
}

module.exports = {
  DEFAULT_TIMEZONE, GRANULARITY_MINUTES, DEFAULT_SETTINGS,
  isDateStr, isMonthStr, isTimeStr, toMinutes, fromMinutes,
  normalizeSettings, localToUtc, weekdayOf, todayInZone, addDays, dayRangeUtc, datesInMonth,
  slotKeysFor, generateDaySlots, overlaps, dayClosedReason, evaluateDay,
  validateSettingsInput, settingsConsistencyErrors,
};
