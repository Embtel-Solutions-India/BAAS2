/**
 * Appointment booking: availability, creation, cancellation, rescheduling and admin queries.
 * The scheduling rules live in utils/bookingSchedule.js; this file adds the database and the validation
 * that must happen on the server no matter what the browser sent.
 */
const crypto = require('crypto');
const Booking = require('../models/Booking');
const BookingSettings = require('../models/BookingSettings');
const BlockedPeriod = require('../models/BlockedPeriod');
const S = require('../utils/bookingSchedule');

// Booking purposes offered on the form (sent to the browser through /config).
const PURPOSES = [
  'General Inquiry',
  'Bookkeeping & Accounting',
  'Tax Services',
  'Payroll Management',
  'Business Formation & Consulting',
  'Registered Agent Services',
  'Bookkeeping Cleanup & Catch-Up',
  'Fractional CFO',
  'Other',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const E164_RE = /^\+[1-9]\d{7,14}$/;
const KEY_RE = /^[A-Za-z0-9_-]{8,100}$/;
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

class BookingError extends Error {
  constructor(status, message, { code = '', fields = null } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// ---------- small helpers ----------
// Plain-text fields: remove tags and control characters, collapse whitespace. HTML escaping happens where text is displayed.
const cleanText = (v, max) => String(v == null ? '' : v).replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanMultiline = (v, max) => String(v == null ? '' : v).replace(/<[^>]*>/g, ' ').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);

function normalizePhone(raw) {
  const text = String(raw || '').trim();
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';
  if (text.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return '';
}

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const newToken = () => crypto.randomBytes(24).toString('hex');
function tokenMatches(token, hash) {
  if (!token || !hash) return false;
  const a = Buffer.from(sha256(token), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function newReference(dateStr) {
  const bytes = crypto.randomBytes(6);
  const tail = Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');
  return `BK-${dateStr.replace(/-/g, '')}-${tail}`;
}
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- settings ----------
async function getSettings() {
  return S.normalizeSettings(await BookingSettings.findOne({ key: 'default' }).lean());
}

function publicConfig(settings) {
  return {
    timezone: settings.timezone,
    bookingEnabled: settings.bookingEnabled,
    workingDays: settings.workingDays,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    lunchBreak: settings.lunchBreak,
    appointmentDurationMinutes: settings.appointmentDurationMinutes,
    slotIntervalMinutes: settings.slotIntervalMinutes,
    maxAdvanceDays: settings.maxAdvanceDays,
    cancellationNoticeHours: settings.cancellationNoticeHours,
    appointmentTypes: settings.appointmentTypes.filter((t) => t.enabled).map((t) => ({ id: t.id, label: t.label, durationMinutes: t.durationMinutes })),
    purposes: PURPOSES,
  };
}

async function updateSettings(input, by) {
  const { errors, value } = S.validateSettingsInput(input);
  if (Object.keys(errors).length) throw new BookingError(400, 'Please fix the highlighted settings.', { fields: errors });
  const current = await getSettings();
  const merged = S.normalizeSettings({ ...current, ...value });
  const consistency = S.settingsConsistencyErrors(merged);
  if (Object.keys(consistency).length) throw new BookingError(400, 'Please fix the highlighted settings.', { fields: consistency });
  const saved = await BookingSettings.findOneAndUpdate(
    { key: 'default' },
    { $set: { ...value, updated_at: new Date(), updatedBy: by || '' }, $setOnInsert: { key: 'default' } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();
  return S.normalizeSettings(saved);
}

// ---------- reading existing bookings / blocks ----------
const activeBookingsIn = (start, end) => Booking.find({ status: 'confirmed', startAtUtc: { $lt: end }, endAtUtc: { $gt: start } }).select('startAtUtc endAtUtc').lean();
const blocksIn = (start, end) => BlockedPeriod.find({ startAtUtc: { $lt: end }, endAtUtc: { $gt: start } }).select('startAtUtc endAtUtc').lean();

function pickType(settings, typeId) {
  const enabled = settings.appointmentTypes.filter((t) => t.enabled);
  if (!typeId) return enabled.length === 1 ? enabled[0] : { ...enabled[0], implicit: true };
  return enabled.find((t) => t.id === typeId) || null;
}

async function evaluateDate(dateStr, settings, { typeId, now = new Date(), ignoreBookingId = null } = {}) {
  const type = pickType(settings, typeId);
  if (!type) throw new BookingError(400, 'Unknown appointment type.');
  const { start, end } = S.dayRangeUtc(dateStr, settings.timezone);
  const [bookings, blocks] = await Promise.all([activeBookingsIn(start, end), blocksIn(start, end)]);
  return { type, day: S.evaluateDay({ dateStr, settings, now, bookings, blocks, durationMinutes: type.durationMinutes, ignoreBookingId }) };
}

// ---------- public availability ----------
async function getAvailableDates(month, { now = new Date() } = {}) {
  if (!S.isMonthStr(month)) throw new BookingError(400, 'month must look like 2026-11.');
  const settings = await getSettings();
  const type = pickType(settings, '');
  const dates = S.datesInMonth(month);
  const rangeStart = S.dayRangeUtc(dates[0], settings.timezone).start;
  const rangeEnd = S.dayRangeUtc(dates[dates.length - 1], settings.timezone).end;
  const [bookings, blocks] = await Promise.all([activeBookingsIn(rangeStart, rangeEnd), blocksIn(rangeStart, rangeEnd)]);
  const availableDates = [];
  const fullyBookedDates = [];
  for (const dateStr of dates) {
    const { start, end } = S.dayRangeUtc(dateStr, settings.timezone);
    const day = S.evaluateDay({
      dateStr, settings, now, durationMinutes: type.durationMinutes,
      bookings: bookings.filter((b) => S.overlaps(new Date(b.startAtUtc), new Date(b.endAtUtc), start, end)),
      blocks: blocks.filter((b) => S.overlaps(new Date(b.startAtUtc), new Date(b.endAtUtc), start, end)),
    });
    if (day.dateAvailable) availableDates.push(dateStr);
    else if (day.reason === 'Fully booked') fullyBookedDates.push(dateStr);
  }
  return { month, timezone: settings.timezone, bookingEnabled: settings.bookingEnabled, availableDates, fullyBookedDates };
}

async function getAvailableSlots(dateStr, { typeId, now = new Date() } = {}) {
  if (!S.isDateStr(dateStr)) throw new BookingError(400, 'date must look like 2026-11-05.');
  const settings = await getSettings();
  const { type, day } = await evaluateDate(dateStr, settings, { typeId, now });
  return {
    date: dateStr,
    timezone: settings.timezone,
    appointmentDurationMinutes: type.durationMinutes,
    dateAvailable: day.dateAvailable,
    ...(day.reason ? { reason: day.reason } : {}),
    slots: day.slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime, available: s.available, ...(s.reason ? { reason: s.reason } : {}) })),
  };
}

// ---------- creating ----------
function validateCustomer(input, settings) {
  const f = {};
  const name = cleanText(input.name, 120);
  if (name.length < 2) f.name = 'Please enter your full name.';
  const email = cleanText(input.email, 200).toLowerCase();
  if (!EMAIL_RE.test(email)) f.email = 'Please enter a valid email address.';
  const phone = normalizePhone(input.phone);
  if (!E164_RE.test(phone)) f.phone = 'Enter a US number, or include the country code, e.g. +14155550123.';
  const purpose = cleanText(input.purpose, 80);
  if (!PURPOSES.includes(purpose)) f.purpose = 'Please choose what the appointment is about.';
  if (input.consent !== true) f.consent = 'Please accept the privacy policy to continue.';
  const enabled = settings.appointmentTypes.filter((t) => t.enabled);
  const typeId = cleanText(input.appointmentType, 40);
  if (enabled.length > 1 && !typeId) f.appointmentType = 'Please choose an appointment type.';
  else if (typeId && !enabled.some((t) => t.id === typeId)) f.appointmentType = 'Unknown appointment type.';
  if (!S.isDateStr(input.date)) f.date = 'Please choose a date.';
  if (!S.isTimeStr(input.startTime)) f.startTime = 'Please choose a time.';
  if (input.timezone && input.timezone !== settings.timezone) f.timezone = `Appointments are scheduled in ${settings.timezone} time.`;
  const idem = input.idempotencyKey === undefined || input.idempotencyKey === null ? '' : String(input.idempotencyKey);
  if (idem && !KEY_RE.test(idem)) f.idempotencyKey = 'Invalid request key.';
  return {
    fields: f,
    value: {
      name, email, phone, purpose, typeId,
      company: cleanText(input.company, 160),
      notes: cleanMultiline(input.notes, 1000),
      idempotencyKey: idem,
    },
  };
}

const isDuplicateKey = (err) => err && (err.code === 11000 || /E11000/.test(err.message || ''));

function slotConflict(reason) {
  if (reason === 'Booked' || reason === 'Unavailable' || reason === 'Time has passed') {
    return new BookingError(409, reason === 'Time has passed'
      ? 'That time has already passed. Please choose another time.'
      : 'Sorry, that time was just taken. Please choose another time.', { code: 'SLOT_UNAVAILABLE' });
  }
  return new BookingError(400, reason ? `That time cannot be booked (${reason.toLowerCase()}).` : 'That time cannot be booked.', { code: 'SLOT_INVALID' });
}

/**
 * Create a booking. Returns { booking, accessToken, duplicate }.
 * The availability check and the insert are separate steps, but the unique index on slotKeys is what really
 * prevents a double booking: if two requests pass the check together, only one insert succeeds and the other
 * gets a 409.
 */
async function createBooking(input, { now = new Date() } = {}) {
  const settings = await getSettings();
  if (!settings.bookingEnabled) throw new BookingError(503, 'Online booking is currently unavailable. Please call (510) 962-7300.', { code: 'BOOKING_DISABLED' });

  const { fields, value } = validateCustomer(input || {}, settings);
  if (Object.keys(fields).length) throw new BookingError(400, 'Please check the highlighted fields.', { fields });

  if (value.idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey: value.idempotencyKey });
    if (existing) return { booking: existing, accessToken: null, duplicate: true };
  }

  const { type, day } = await evaluateDate(input.date, settings, { typeId: value.typeId, now });
  if (!day.dateAvailable && !day.slots.length) throw new BookingError(409, `That date cannot be booked (${(day.reason || 'unavailable').toLowerCase()}).`, { code: 'DATE_UNAVAILABLE' });
  const slot = day.slots.find((s) => s.startTime === input.startTime);
  if (!slot) throw new BookingError(400, 'That time is not one of our appointment times.', { code: 'SLOT_INVALID' });
  if (!slot.available) throw slotConflict(slot.reason);

  const accessToken = newToken();
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const booking = await Booking.create({
        reference: newReference(input.date),
        accessTokenHash: sha256(accessToken),
        ...(value.idempotencyKey ? { idempotencyKey: value.idempotencyKey } : {}),
        customerName: value.name, customerEmail: value.email, customerPhone: value.phone, companyName: value.company,
        purpose: value.purpose, appointmentType: type.id, appointmentTypeLabel: type.label, customerNotes: value.notes,
        startAtUtc: slot.startUtc, endAtUtc: slot.endUtc, durationMinutes: type.durationMinutes,
        timezone: settings.timezone, localDate: input.date, localStartTime: slot.startTime, localEndTime: slot.endTime,
        slotKeys: S.slotKeysFor(slot.startUtc, slot.endUtc),
        history: [{ action: 'created', by: 'customer' }],
      });
      return { booking, accessToken, duplicate: false };
    } catch (err) {
      lastErr = err;
      if (!isDuplicateKey(err)) throw err;
      const pattern = JSON.stringify(err.keyPattern || err.message || '');
      if (/idempotencyKey/.test(pattern)) {
        const existing = await Booking.findOne({ idempotencyKey: value.idempotencyKey });
        if (existing) return { booking: existing, accessToken: null, duplicate: true };
      }
      if (/reference/.test(pattern)) continue; // reference collision: pick another and retry
      throw new BookingError(409, 'Sorry, that time was just taken. Please choose another time.', { code: 'SLOT_UNAVAILABLE' });
    }
  }
  throw lastErr;
}

// ---------- reading one booking ----------
async function findForCustomer(reference, token) {
  const booking = await Booking.findOne({ reference: String(reference || '').toUpperCase() }).select('+accessTokenHash');
  // Same answer for "no such booking" and "wrong token", so references cannot be probed.
  if (!booking || !tokenMatches(token, booking.accessTokenHash)) throw new BookingError(404, 'We could not find that booking. Check the link in your confirmation email.', { code: 'NOT_FOUND' });
  return booking;
}

function toPublic(booking, settings = null) {
  const b = booking.toObject ? booking.toObject() : booking;
  const noticeHours = settings ? settings.cancellationNoticeHours : S.DEFAULT_SETTINGS.cancellationNoticeHours;
  const cutoff = new Date(new Date(b.startAtUtc).getTime() - noticeHours * 3600000);
  return {
    id: b.reference,
    reference: b.reference,
    status: b.status,
    name: b.customerName,
    email: b.customerEmail,
    phone: b.customerPhone,
    company: b.companyName,
    purpose: b.purpose,
    appointmentType: b.appointmentType,
    appointmentTypeLabel: b.appointmentTypeLabel,
    notes: b.customerNotes,
    date: b.localDate,
    startTime: b.localStartTime,
    endTime: b.localEndTime,
    durationMinutes: b.durationMinutes,
    timezone: b.timezone,
    startAt: new Date(b.startAtUtc).toISOString(),
    endAt: new Date(b.endAtUtc).toISOString(),
    canChange: b.status === 'confirmed' && new Date() <= cutoff,
    changeDeadline: cutoff.toISOString(),
    cancellationNoticeHours: noticeHours,
  };
}

// ---------- cancelling / rescheduling ----------
function assertCustomerMayChange(booking, settings) {
  if (booking.status !== 'confirmed') throw new BookingError(409, `This booking is already ${booking.status.replace('_', ' ')}.`, { code: 'NOT_ACTIVE' });
  const cutoff = booking.startAtUtc.getTime() - settings.cancellationNoticeHours * 3600000;
  if (Date.now() > cutoff) throw new BookingError(403, `Bookings can be changed online up to ${settings.cancellationNoticeHours} hours before the appointment. Please call (510) 962-7300.`, { code: 'TOO_LATE' });
}

async function cancelBooking(booking, { by = 'customer', admin = false, reason = '' } = {}) {
  const settings = await getSettings();
  if (!admin) assertCustomerMayChange(booking, settings);
  else if (booking.status !== 'confirmed') throw new BookingError(409, `This booking is already ${booking.status.replace('_', ' ')}.`, { code: 'NOT_ACTIVE' });
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'confirmed' },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: by, cancelReason: cleanText(reason, 300), updated_at: new Date() },
      $push: { history: { action: 'cancelled', by, detail: cleanText(reason, 300) } } },
    { returnDocument: 'after' },
  );
  if (!updated) throw new BookingError(409, 'This booking was already changed.', { code: 'NOT_ACTIVE' });
  return updated;
}

async function rescheduleBooking(booking, { date, startTime, by = 'customer', admin = false, now = new Date() } = {}) {
  const settings = await getSettings();
  if (!admin) assertCustomerMayChange(booking, settings);
  else if (booking.status !== 'confirmed') throw new BookingError(409, `This booking is already ${booking.status.replace('_', ' ')}.`, { code: 'NOT_ACTIVE' });
  if (!S.isDateStr(date) || !S.isTimeStr(startTime)) throw new BookingError(400, 'Please choose a new date and time.');

  const { day } = await evaluateDate(date, settings, { typeId: booking.appointmentType, now, ignoreBookingId: booking._id });
  if (!day.dateAvailable && !day.slots.length) throw new BookingError(409, `That date cannot be booked (${(day.reason || 'unavailable').toLowerCase()}).`, { code: 'DATE_UNAVAILABLE' });
  const slot = day.slots.find((s) => s.startTime === startTime);
  if (!slot) throw new BookingError(400, 'That time is not one of our appointment times.', { code: 'SLOT_INVALID' });
  if (!slot.available) throw slotConflict(slot.reason);

  const previous = { date: booking.localDate, startTime: booking.localStartTime };
  const accessToken = newToken(); // the old link is replaced by the one in the new email
  try {
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'confirmed' },
      { $set: {
          startAtUtc: slot.startUtc, endAtUtc: slot.endUtc, localDate: date, localStartTime: slot.startTime, localEndTime: slot.endTime,
          slotKeys: S.slotKeysFor(slot.startUtc, slot.endUtc), accessTokenHash: sha256(accessToken), updated_at: new Date(),
        },
        $inc: { rescheduleCount: 1 },
        $push: { history: { action: 'rescheduled', by, detail: `${previous.date} ${previous.startTime} -> ${date} ${slot.startTime}` } } },
      { returnDocument: 'after' },
    );
    if (!updated) throw new BookingError(409, 'This booking was already changed.', { code: 'NOT_ACTIVE' });
    return { booking: updated, accessToken, previous };
  } catch (err) {
    if (isDuplicateKey(err)) throw new BookingError(409, 'Sorry, that time was just taken. Please choose another time.', { code: 'SLOT_UNAVAILABLE' });
    throw err;
  }
}

// ---------- admin ----------
function buildFilter(query = {}) {
  const filter = {};
  if (query.status && ['confirmed', 'cancelled', 'completed', 'no_show'].includes(query.status)) filter.status = query.status;
  if (query.type) filter.appointmentType = cleanText(query.type, 40);
  if (S.isDateStr(query.from) || S.isDateStr(query.to)) {
    filter.localDate = {};
    if (S.isDateStr(query.from)) filter.localDate.$gte = query.from;
    if (S.isDateStr(query.to)) filter.localDate.$lte = query.to;
  }
  const q = cleanText(query.q, 100);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ customerName: rx }, { customerEmail: rx }, { customerPhone: rx }, { reference: rx }, { companyName: rx }];
  }
  return filter;
}

async function listBookings(query = {}) {
  const filter = buildFilter(query);
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 25));
  const sort = query.sort === 'desc' ? -1 : 1;
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ startAtUtc: sort }).skip((page - 1) * limit).limit(limit),
    Booking.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function bookingStats(now = new Date()) {
  const settings = await getSettings();
  const today = S.todayInZone(now, settings.timezone);
  const [total, todayCount, upcoming, byStatusRaw] = await Promise.all([
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'confirmed', localDate: today }),
    Booking.countDocuments({ status: 'confirmed', startAtUtc: { $gte: now } }),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const byStatus = { confirmed: 0, cancelled: 0, completed: 0, no_show: 0 };
  byStatusRaw.forEach((r) => { byStatus[r._id] = r.n; });
  return { total, today: todayCount, upcoming, cancelled: byStatus.cancelled, byStatus };
}

async function updateBookingAdmin(id, { status, internalNotes }, by) {
  const set = { updated_at: new Date() };
  const entries = [];
  if (status !== undefined) {
    if (!['completed', 'no_show'].includes(status)) throw new BookingError(400, 'Use cancel or reschedule for those changes.');
    set.status = status; entries.push({ action: `marked ${status}`, by });
  }
  if (internalNotes !== undefined) { set.internalNotes = cleanMultiline(internalNotes, 3000); entries.push({ action: 'note updated', by }); }
  const updated = await Booking.findOneAndUpdate({ _id: id }, { $set: set, ...(entries.length ? { $push: { history: { $each: entries } } } : {}) }, { returnDocument: 'after' });
  if (!updated) throw new BookingError(404, 'Booking not found.');
  return updated;
}

async function createBlock({ type, date, startTime, endTime, reason }, by) {
  const settings = await getSettings();
  if (!S.isDateStr(date)) throw new BookingError(400, 'Choose a date.');
  let start; let end;
  if (type === 'date') {
    ({ start, end } = S.dayRangeUtc(date, settings.timezone));
  } else if (type === 'slot') {
    if (!S.isTimeStr(startTime) || !S.isTimeStr(endTime) || S.toMinutes(startTime) >= S.toMinutes(endTime)) throw new BookingError(400, 'Choose a start time that is before the end time.');
    const a = S.localToUtc(date, startTime, settings.timezone);
    const b = S.localToUtc(date, endTime, settings.timezone);
    if (a.issue || b.issue) throw new BookingError(400, 'That time is not valid on this date.');
    start = a.utc; end = b.utc;
  } else {
    throw new BookingError(400, 'Block type must be "date" or "slot".');
  }
  return BlockedPeriod.create({ type, localDate: date, startAtUtc: start, endAtUtc: end, reason: cleanText(reason, 200), createdBy: by || '' });
}

const listBlocks = (fromDate) => BlockedPeriod.find(S.isDateStr(fromDate) ? { localDate: { $gte: fromDate } } : {}).sort({ startAtUtc: 1 }).limit(500);

const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function exportCsv(query = {}) {
  const items = await Booking.find(buildFilter(query)).sort({ startAtUtc: 1 }).limit(5000);
  const header = ['Reference', 'Status', 'Date', 'Start', 'End', 'Timezone', 'Name', 'Email', 'Phone', 'Company', 'Purpose', 'Type', 'Notes', 'Created'];
  const rows = items.map((b) => [b.reference, b.status, b.localDate, b.localStartTime, b.localEndTime, b.timezone, b.customerName, b.customerEmail, b.customerPhone, b.companyName, b.purpose, b.appointmentTypeLabel || b.appointmentType, b.customerNotes, b.created_at.toISOString()]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

module.exports = {
  PURPOSES, BookingError, cleanText, normalizePhone, sha256,
  getSettings, publicConfig, updateSettings,
  getAvailableDates, getAvailableSlots, createBooking,
  findForCustomer, toPublic, cancelBooking, rescheduleBooking,
  listBookings, bookingStats, updateBookingAdmin, createBlock, listBlocks, exportCsv,
};
