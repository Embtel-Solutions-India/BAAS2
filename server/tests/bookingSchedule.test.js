// Run with: npm test   (node --test)
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../utils/bookingSchedule');

const settings = S.normalizeSettings({});
// A Thursday in November 2026, after daylight saving ended on Nov 1.
const DAY = '2026-11-05';
// A "now" well before the day so nothing is filtered out as past.
const EARLY = new Date('2026-10-30T12:00:00Z');

test('defaults match the business rules', () => {
  assert.equal(settings.timezone, 'America/Los_Angeles');
  assert.deepEqual(settings.workingDays, [1, 2, 3, 4, 5]);
  assert.equal(settings.openingTime, '09:30');
  assert.equal(settings.closingTime, '18:00');
  assert.deepEqual(settings.lunchBreak, { start: '11:30', end: '12:30' });
  assert.equal(settings.appointmentDurationMinutes, 30);
});

test('weekday slots: 15 bookable appointments, first 9:30, last 5:30-6:00, no lunch', () => {
  const day = S.evaluateDay({ dateStr: DAY, settings, now: EARLY });
  assert.equal(day.dateAvailable, true);
  const open = day.slots.filter((s) => s.available).map((s) => s.startTime);
  assert.deepEqual(open, ['09:30', '10:00', '10:30', '11:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']);
  assert.equal(open.length, 15);
  const last = day.slots[day.slots.length - 1];
  assert.equal(last.startTime, '17:30');
  assert.equal(last.endTime, '18:00');
  // nothing is bookable from 11:30 to 12:30, and those slots say why
  const lunch = day.slots.filter((s) => s.lunch);
  assert.deepEqual(lunch.map((s) => s.startTime), ['11:30', '12:00']);
  assert.ok(lunch.every((s) => !s.available && s.reason === 'Lunch break'));
  // every slot is exactly 30 minutes
  assert.ok(day.slots.every((s) => s.endUtc - s.startUtc === 30 * 60000));
});

test('no appointment extends past closing time', () => {
  const day = S.evaluateDay({ dateStr: DAY, settings, now: EARLY });
  assert.ok(day.slots.every((s) => S.toMinutes(s.endTime) <= S.toMinutes('18:00')));
});

test('weekends, past dates, holidays and far-future dates are closed', () => {
  assert.equal(S.evaluateDay({ dateStr: '2026-11-07', settings, now: EARLY }).dateAvailable, false); // Saturday
  assert.equal(S.evaluateDay({ dateStr: '2026-11-08', settings, now: EARLY }).dateAvailable, false); // Sunday
  assert.equal(S.evaluateDay({ dateStr: '2026-10-29', settings, now: EARLY }).reason, 'This date has passed');
  assert.equal(S.evaluateDay({ dateStr: '2026-11-05', settings: S.normalizeSettings({ holidays: ['2026-11-05'] }), now: EARLY }).reason, 'Closed for a holiday');
  assert.equal(S.evaluateDay({ dateStr: '2027-06-01', settings, now: EARLY }).reason, 'Too far in the future');
  assert.equal(S.evaluateDay({ dateStr: DAY, settings: S.normalizeSettings({ bookingEnabled: false }), now: EARLY }).dateAvailable, false);
});

test('booked, blocked and past slots are unavailable', () => {
  const day0 = S.evaluateDay({ dateStr: DAY, settings, now: EARLY });
  const ten = day0.slots.find((s) => s.startTime === '10:00');
  const bookings = [{ _id: 'b1', startAtUtc: ten.startUtc, endAtUtc: ten.endUtc }];
  const two = day0.slots.find((s) => s.startTime === '14:00');
  const blocks = [{ startAtUtc: two.startUtc, endAtUtc: two.endUtc }];
  const day = S.evaluateDay({ dateStr: DAY, settings, now: EARLY, bookings, blocks });
  assert.equal(day.slots.find((s) => s.startTime === '10:00').reason, 'Booked');
  assert.equal(day.slots.find((s) => s.startTime === '14:00').reason, 'Unavailable');
  assert.equal(day.slots.find((s) => s.startTime === '10:30').available, true);
  // a cancelled booking is simply not passed in, so its slot opens again
  assert.equal(S.evaluateDay({ dateStr: DAY, settings, now: EARLY, bookings: [] }).slots.find((s) => s.startTime === '10:00').available, true);
  // rescheduling ignores the booking being moved
  assert.equal(S.evaluateDay({ dateStr: DAY, settings, now: EARLY, bookings, ignoreBookingId: 'b1' }).slots.find((s) => s.startTime === '10:00').available, true);
  // "now" is 9:45 AM Pacific on the day with 60 minutes notice: slots before 10:45 are gone
  const now = new Date(day0.slots.find((s) => s.startTime === '09:30').startUtc.getTime() + 15 * 60000);
  const late = S.evaluateDay({ dateStr: DAY, settings, now });
  assert.equal(late.slots.find((s) => s.startTime === '10:30').available, false);
  assert.equal(late.slots.find((s) => s.startTime === '11:00').available, true);
});

test('a fully booked day reports Fully booked', () => {
  const day0 = S.evaluateDay({ dateStr: DAY, settings, now: EARLY });
  const bookings = day0.slots.filter((s) => s.available).map((s, i) => ({ _id: `b${i}`, startAtUtc: s.startUtc, endAtUtc: s.endUtc }));
  const full = S.evaluateDay({ dateStr: DAY, settings, now: EARLY, bookings });
  assert.equal(full.dateAvailable, false);
  assert.equal(full.reason, 'Fully booked');
});

test('timezone: standard time (PST, UTC-8) and daylight time (PDT, UTC-7) are both correct', () => {
  // 2026-11-05 is PST: 09:30 Pacific = 17:30 UTC
  assert.equal(S.localToUtc('2026-11-05', '09:30').utc.toISOString(), '2026-11-05T17:30:00.000Z');
  // 2026-07-15 is PDT: 09:30 Pacific = 16:30 UTC
  assert.equal(S.localToUtc('2026-07-15', '09:30').utc.toISOString(), '2026-07-15T16:30:00.000Z');
  // the same business hours land on different UTC hours across the change
  const summer = S.generateDaySlots('2026-07-15', settings)[0];
  const winter = S.generateDaySlots('2026-11-05', settings)[0];
  assert.equal(summer.startUtc.getUTCHours(), 16);
  assert.equal(winter.startUtc.getUTCHours(), 17);
});

test('timezone: the Los Angeles date differs from the UTC date late in the day', () => {
  // 6:30 PM Pacific on Nov 5 is already Nov 6 in UTC
  const now = new Date('2026-11-06T02:30:00Z');
  assert.equal(S.todayInZone(now), '2026-11-05');
  assert.equal(now.toISOString().slice(0, 10), '2026-11-06');
  const range = S.dayRangeUtc('2026-11-05');
  assert.equal(range.start.toISOString(), '2026-11-05T08:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-11-06T08:00:00.000Z');
});

test('timezone: daylight saving transitions are detected', () => {
  // Spring forward: 2:30 AM does not exist on 2027-03-14
  assert.equal(S.localToUtc('2027-03-14', '02:30').issue, 'nonexistent');
  // Fall back: 1:30 AM happens twice on 2026-11-01
  assert.equal(S.localToUtc('2026-11-01', '01:30').issue, 'ambiguous');
  // Ordinary times are fine
  assert.equal(S.localToUtc('2026-11-01', '09:30').issue, null);
  // a day made only of such times has no slots left, instead of guessing
  const odd = S.normalizeSettings({ openingTime: '02:00', closingTime: '03:00', lunchBreak: { start: '02:00', end: '02:15' } });
  assert.equal(S.generateDaySlots('2027-03-14', odd).length, 0);
});

test('the business day on a transition date still has 15 slots with correct offsets', () => {
  // 2026-11-02 is the Monday after fall back; 2027-03-15 the Monday after spring forward
  for (const date of ['2026-11-02', '2027-03-15']) {
    const slots = S.generateDaySlots(date, settings).filter((s) => !s.lunch);
    assert.equal(slots.length, 15);
    assert.equal(slots[0].startTime, '09:30');
  }
});

test('slot keys cover each 15-minute cell, so overlapping bookings collide', () => {
  const [a] = S.generateDaySlots(DAY, settings);
  assert.equal(S.slotKeysFor(a.startUtc, a.endUtc).length, 2);
  const keysA = S.slotKeysFor(a.startUtc, a.endUtc);
  const overlapping = S.slotKeysFor(new Date(a.startUtc.getTime() + 15 * 60000), new Date(a.endUtc.getTime() + 15 * 60000));
  assert.ok(keysA.some((k) => overlapping.includes(k)));
  const next = S.generateDaySlots(DAY, settings)[1];
  assert.ok(!S.slotKeysFor(next.startUtc, next.endUtc).some((k) => keysA.includes(k)), 'back-to-back appointments do not collide');
});

test('month helper and date validation', () => {
  assert.equal(S.datesInMonth('2026-11').length, 30);
  assert.equal(S.datesInMonth('2028-02').length, 29);
  assert.ok(S.isDateStr('2026-11-05'));
  assert.ok(!S.isDateStr('2026-02-30'));
  assert.ok(!S.isDateStr('11/05/2026'));
  assert.ok(S.isMonthStr('2026-11') && !S.isMonthStr('2026-13'));
  assert.ok(S.isTimeStr('09:30') && !S.isTimeStr('9:30') && !S.isTimeStr('24:00'));
});

test('settings validation rejects bad input and keeps good input', () => {
  const bad = S.validateSettingsInput({ openingTime: '9am', appointmentDurationMinutes: 20, workingDays: [0, 8], holidays: ['x'], lunchBreak: { start: '13:00', end: '12:00' } });
  for (const k of ['openingTime', 'appointmentDurationMinutes', 'workingDays', 'holidays', 'lunchBreak']) assert.ok(bad.errors[k], k);
  const ok = S.validateSettingsInput({ openingTime: '10:00', closingTime: '17:00', appointmentDurationMinutes: 45, workingDays: [1, 2, 3], timezone: 'America/Los_Angeles' });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.value.appointmentDurationMinutes, 45);
  assert.ok(S.validateSettingsInput({ timezone: 'Mars/Phobos' }).errors.timezone);
  assert.ok(S.settingsConsistencyErrors(S.normalizeSettings({ openingTime: '18:00', closingTime: '09:00' })).closingTime);
  assert.ok(S.settingsConsistencyErrors(S.normalizeSettings({ lunchBreak: { start: '08:00', end: '09:00' } })).lunchBreak);
});
