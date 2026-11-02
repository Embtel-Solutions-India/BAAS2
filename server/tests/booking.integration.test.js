// Integration tests against a throwaway in-memory MongoDB (nothing touches a real database).
// Run with: npm test   (the first run downloads a MongoDB binary; set BOOKING_TEST_SKIP_DB=1 to skip these tests)
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

if (process.env.BOOKING_TEST_SKIP_DB) {
  test('database tests skipped', { skip: true }, () => {});
} else {
  process.env.BOOKING_WRITE_LIMIT = '1000'; // the real limit (12 per 15 minutes) is exercised in its own test below
  const mongoose = require('mongoose');
  const { MongoMemoryServer } = require('mongodb-memory-server');

  let mongod; let server; let base;
  const sent = [];
  let failEmail = false;

  test.before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'booking_test' });

    // Capture emails instead of sending them.
    const emailCfg = require('../config/email');
    emailCfg.sendMail = async (msg) => { if (failEmail) throw new Error('smtp down'); sent.push(msg); };

    const Booking = require('../models/Booking');
    await Booking.init();
    await require('../models/BlockedPeriod').init();

    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/api/bookings', require('../routes/bookings'));
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}/api/bookings`;
  });

  test.after(async () => {
    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    await mongod.stop();
  });

  const call = async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };

  // Next Monday-Friday date at least 3 days ahead, so notice and window rules never interfere.
  // Each different offset gets its own date, even when weekends would map two offsets to the same Monday.
  const handedOut = new Map(); // offset -> date
  const nextWeekday = (offset = 3) => {
    if (handedOut.has(offset)) return handedOut.get(offset);
    const S = require('../utils/bookingSchedule');
    const taken = new Set(handedOut.values());
    let d = S.addDays(S.todayInZone(), offset);
    while (![1, 2, 3, 4, 5].includes(S.weekdayOf(d)) || taken.has(d)) d = S.addDays(d, 1);
    handedOut.set(offset, d);
    return d;
  };
  const customer = (over = {}) => ({
    name: 'Jane Customer', email: 'jane@example.com', phone: '(415) 555-0123', company: 'Acme', purpose: 'Tax Services',
    appointmentType: 'consultation', timezone: 'America/Los_Angeles', notes: 'Hello <b>there</b>', consent: true, ...over,
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  test('config and availability come from the server', async () => {
    const cfg = await call('GET', '/config');
    assert.equal(cfg.status, 200);
    assert.equal(cfg.body.timezone, 'America/Los_Angeles');
    assert.equal(cfg.body.openingTime, '09:30');
    assert.ok(cfg.body.purposes.includes('Tax Services'));
    const date = nextWeekday();
    const slots = await call('GET', `/available-slots?date=${date}`);
    assert.equal(slots.status, 200);
    assert.equal(slots.body.slots.filter((s) => s.available).length, 15);
    const month = await call('GET', `/available-dates?month=${date.slice(0, 7)}`);
    assert.ok(month.body.availableDates.includes(date));
    assert.equal((await call('GET', '/available-slots?date=nope')).status, 400);
    assert.equal((await call('GET', '/available-dates?month=2026-13')).status, 400);
  });

  test('a booking is created, stored in UTC, and its slot disappears', async () => {
    const date = nextWeekday();
    const r = await call('POST', '/', customer({ date, startTime: '10:00', idempotencyKey: 'key-create-0001' }));
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.match(r.body.booking.reference, /^BK-\d{8}-[A-Z2-9]{6}$/);
    assert.equal(r.body.booking.endTime, '10:30');
    assert.equal(r.body.booking.status, 'confirmed');
    assert.ok(r.body.accessToken);
    const Booking = require('../models/Booking');
    const stored = await Booking.findOne({ reference: r.body.booking.reference }).select('+accessTokenHash');
    assert.equal(stored.endAtUtc - stored.startAtUtc, 30 * 60000);
    assert.equal(stored.customerPhone, '+14155550123');
    assert.ok(!stored.customerNotes.includes('<b>'), 'html stripped from notes');
    assert.notEqual(stored.accessTokenHash, r.body.accessToken, 'only a hash of the token is stored');
    const slots = await call('GET', `/available-slots?date=${date}`);
    const ten = slots.body.slots.find((s) => s.startTime === '10:00');
    assert.equal(ten.available, false);
    // emails: customer confirmation + admin alert
    await wait(300);
    assert.ok(sent.some((m) => m.to === 'jane@example.com' && /confirmed/i.test(m.subject)));
    assert.ok(sent.some((m) => m.to !== 'jane@example.com' && /New booking/.test(m.subject)));
    assert.ok(sent.find((m) => m.to === 'jane@example.com').html.includes('/book/manage/'));
  });

  test('retrying with the same idempotency key does not create a second booking', async () => {
    const date = nextWeekday(4);
    const body = customer({ date, startTime: '11:00', idempotencyKey: 'key-retry-0002' });
    const a = await call('POST', '/', body);
    const b = await call('POST', '/', body);
    assert.equal(a.status, 201);
    assert.equal(b.status, 200);
    assert.equal(b.body.duplicate, true);
    assert.equal(a.body.booking.reference, b.body.booking.reference);
    const Booking = require('../models/Booking');
    assert.equal(await Booking.countDocuments({ idempotencyKey: 'key-retry-0002' }), 1);
  });

  test('concurrent attempts for the same slot: exactly one wins, the rest get 409', async () => {
    const date = nextWeekday(5);
    const attempts = Array.from({ length: 8 }, (_, i) => call('POST', '/', customer({ date, startTime: '14:00', email: `racer${i}@example.com`, idempotencyKey: `race-key-${i}-0003` })));
    const results = await Promise.all(attempts);
    const ok = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);
    assert.equal(ok.length, 1, JSON.stringify(results.map((r) => r.status)));
    assert.equal(conflicts.length, 7);
    assert.ok(conflicts.every((r) => r.body.code === 'SLOT_UNAVAILABLE'));
    const Booking = require('../models/Booking');
    assert.equal(await Booking.countDocuments({ status: 'confirmed', localDate: date, localStartTime: '14:00' }), 1);
  });

  test('invalid slots and invalid forms are rejected by the server', async () => {
    const date = nextWeekday(6);
    const bad = async (over, status, key) => {
      const r = await call('POST', '/', customer({ date, startTime: '15:00', ...over }));
      assert.equal(r.status, status, JSON.stringify(r.body));
      if (key) assert.ok(r.body.fields && r.body.fields[key], `${key} error expected`);
      return r;
    };
    await bad({ startTime: '09:00' }, 400); // before opening
    await bad({ startTime: '11:30' }, 400); // lunch
    await bad({ startTime: '12:00' }, 400); // lunch
    await bad({ startTime: '18:00' }, 400); // after the last slot
    await bad({ startTime: '15:15' }, 400); // not on the 30-minute grid
    await bad({ startTime: '25:00' }, 400, 'startTime');
    await bad({ date: '2026-11-07', startTime: '15:00' }, 409); // Saturday (past or weekend)
    await bad({ date: '2020-01-06' }, 409); // in the past
    await bad({ name: '' }, 400, 'name');
    await bad({ email: 'not-an-email' }, 400, 'email');
    await bad({ phone: '123' }, 400, 'phone');
    await bad({ purpose: 'Something else' }, 400, 'purpose');
    await bad({ consent: false }, 400, 'consent');
    await bad({ timezone: 'America/New_York' }, 400, 'timezone');
    await bad({ appointmentType: 'unknown' }, 400, 'appointmentType');
    // the client cannot choose the end time or the status
    const r = await call('POST', '/', customer({ date, startTime: '15:30', endTime: '23:00', status: 'completed', durationMinutes: 600 }));
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.booking.endTime, '16:00');
    assert.equal(r.body.booking.status, 'confirmed');
  });

  test('customer can read, reschedule and cancel only with the right token', async () => {
    const date = nextWeekday(7);
    const created = await call('POST', '/', customer({ date, startTime: '16:00', idempotencyKey: 'key-manage-0004' }));
    const { reference } = created.body.booking;
    const token = created.body.accessToken;
    assert.equal((await call('GET', `/${reference}`)).status, 404);
    assert.equal((await call('GET', `/${reference}?token=wrong`)).status, 404);
    assert.equal((await call('GET', `/BK-00000000-AAAAAA?token=${token}`)).status, 404);
    const got = await call('GET', `/${reference}?token=${token}`);
    assert.equal(got.status, 200);
    assert.equal(got.body.booking.startTime, '16:00');

    // reschedule to a taken slot -> 409; to a free one -> ok, and the old slot reopens
    const other = await call('POST', '/', customer({ date, startTime: '16:30', email: 'other@example.com', idempotencyKey: 'key-other-0005' }));
    assert.equal(other.status, 201);
    const clash = await call('POST', `/${reference}/reschedule`, { token, date, startTime: '16:30' });
    assert.equal(clash.status, 409);
    const moved = await call('POST', `/${reference}/reschedule`, { token, date, startTime: '17:00' });
    assert.equal(moved.status, 200, JSON.stringify(moved.body));
    assert.equal(moved.body.booking.startTime, '17:00');
    assert.ok(moved.body.accessToken && moved.body.accessToken !== token);
    assert.equal((await call('GET', `/${reference}?token=${token}`)).status, 404, 'the old link stops working');
    let slots = (await call('GET', `/available-slots?date=${date}`)).body.slots;
    assert.equal(slots.find((s) => s.startTime === '16:00').available, true);
    assert.equal(slots.find((s) => s.startTime === '17:00').available, false);

    // cancel
    const cancelled = await call('POST', `/${reference}/cancel`, { token: moved.body.accessToken });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.booking.status, 'cancelled');
    slots = (await call('GET', `/available-slots?date=${date}`)).body.slots;
    assert.equal(slots.find((s) => s.startTime === '17:00').available, true, 'a cancelled booking frees its slot');
    assert.equal((await call('POST', `/${reference}/cancel`, { token: moved.body.accessToken })).status, 409);
    // the freed slot can be booked again
    const again = await call('POST', '/', customer({ date, startTime: '17:00', email: 'again@example.com', idempotencyKey: 'key-again-0006' }));
    assert.equal(again.status, 201);
  });

  test('inside the cancellation window customers must call instead', async () => {
    const S = require('../utils/bookingSchedule');
    const Booking = require('../models/Booking');
    const date = nextWeekday(8);
    const created = await call('POST', '/', customer({ date, startTime: '09:30', idempotencyKey: 'key-late-0007' }));
    // pretend the appointment is only 2 hours away
    const soon = new Date(Date.now() + 2 * 3600000);
    await Booking.updateOne({ reference: created.body.booking.reference }, { $set: { startAtUtc: soon, endAtUtc: new Date(soon.getTime() + 1800000), slotKeys: S.slotKeysFor(soon, new Date(soon.getTime() + 1800000)) } });
    const r = await call('POST', `/${created.body.booking.reference}/cancel`, { token: created.body.accessToken });
    assert.equal(r.status, 403);
    assert.equal(r.body.code, 'TOO_LATE');
  });

  test('admin blocks and holidays remove availability', async () => {
    const svc = require('../services/bookingService');
    const date = nextWeekday(9);
    const block = await svc.createBlock({ type: 'slot', date, startTime: '13:00', endTime: '14:00', reason: 'Team meeting' }, 'test');
    let slots = (await call('GET', `/available-slots?date=${date}`)).body.slots;
    assert.equal(slots.find((s) => s.startTime === '13:00').available, false);
    assert.equal(slots.find((s) => s.startTime === '13:30').available, false);
    assert.equal(slots.find((s) => s.startTime === '14:00').available, true);
    const r = await call('POST', '/', customer({ date, startTime: '13:00', idempotencyKey: 'key-block-0008' }));
    assert.equal(r.status, 409);
    await require('../models/BlockedPeriod').findByIdAndDelete(block._id);

    const date2 = nextWeekday(10);
    await svc.createBlock({ type: 'date', date: date2, reason: 'Office closed' }, 'test');
    const day = (await call('GET', `/available-slots?date=${date2}`)).body;
    assert.equal(day.slots.filter((s) => s.available).length, 0);
    const month = (await call('GET', `/available-dates?month=${date2.slice(0, 7)}`)).body;
    assert.ok(!month.availableDates.includes(date2));
  });

  test('a fully booked date shows as fully booked, not available', async () => {
    const date = nextWeekday(12);
    const slots = (await call('GET', `/available-slots?date=${date}`)).body.slots.filter((s) => s.available);
    for (const s of slots) {
      const r = await call('POST', '/', customer({ date, startTime: s.startTime, email: `full${s.startTime.replace(':', '')}@example.com`, idempotencyKey: `full-${date}-${s.startTime}-0009`.replace(/:/g, '') }));
      assert.equal(r.status, 201, JSON.stringify(r.body));
    }
    const month = (await call('GET', `/available-dates?month=${date.slice(0, 7)}`)).body;
    assert.ok(!month.availableDates.includes(date));
    assert.ok(month.fullyBookedDates.includes(date));
    assert.equal((await call('GET', `/available-slots?date=${date}`)).body.reason, 'Fully booked');
  });

  test('an email failure keeps the booking and is recorded', async () => {
    failEmail = true;
    const date = nextWeekday(13);
    const r = await call('POST', '/', customer({ date, startTime: '10:30', idempotencyKey: 'key-mail-0010' }));
    assert.equal(r.status, 201, JSON.stringify(r.body));
    await wait(3000); // retries back off for about 1.2 seconds
    failEmail = false;
    const Booking = require('../models/Booking');
    const b = await Booking.findOne({ reference: r.body.booking.reference });
    assert.equal(b.status, 'confirmed');
    assert.equal(b.notifications.customerConfirmation.status, 'failed');
    assert.equal(b.notifications.customerConfirmation.attempts, 3);
  });

  test('disabling online booking blocks new bookings', async () => {
    const svc = require('../services/bookingService');
    await svc.updateSettings({ bookingEnabled: false }, 'test');
    const date = nextWeekday(14);
    const r = await call('POST', '/', customer({ date, startTime: '09:30', idempotencyKey: 'key-off-0011' }));
    assert.equal(r.status, 503);
    assert.equal((await call('GET', `/available-slots?date=${date}`)).body.dateAvailable, false);
    await svc.updateSettings({ bookingEnabled: true }, 'test');
  });

  test('the public write endpoints are rate limited', async () => {
    process.env.BOOKING_WRITE_LIMIT = '3';
    delete require.cache[require.resolve('../routes/bookings')];
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/api/bookings', require('../routes/bookings'));
    const srv = http.createServer(app);
    await new Promise((r) => srv.listen(0, r));
    const url = `http://127.0.0.1:${srv.address().port}/api/bookings`;
    const statuses = [];
    for (let i = 0; i < 5; i++) statuses.push((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status);
    await new Promise((r) => srv.close(r));
    process.env.BOOKING_WRITE_LIMIT = '1000';
    assert.deepEqual(statuses, [400, 400, 400, 429, 429]);
  });
}
