// Admin booking API: authentication, roles, filters, settings validation, blocks, cancel / reschedule, CSV export.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

if (process.env.BOOKING_TEST_SKIP_DB) {
  test('admin database tests skipped', { skip: true }, () => {});
} else {
  process.env.JWT_SECRET = 'test_secret';
  process.env.BOOKING_WRITE_LIMIT = '1000';
  const mongoose = require('mongoose');
  const jwt = require('jsonwebtoken');
  const { MongoMemoryServer } = require('mongodb-memory-server');

  let mongod; let server; let pubServer; let base; let pub;
  const sent = [];
  const cookie = (role) => `token=${jwt.sign({ id: 1, role, email: `${role}@test.local` }, 'test_secret')}`;

  test.before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'booking_admin_test' });
    require('../config/email').sendMail = async (m) => { sent.push(m); };
    await require('../models/Booking').init();
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use(require('cookie-parser')());
    app.use('/api/admin/bookings', require('../routes/adminBookings'));
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}/api/admin/bookings`;
    const pubApp = express();
    pubApp.use(express.json());
    pubApp.use('/api/bookings', require('../routes/bookings'));
    pubServer = http.createServer(pubApp);
    await new Promise((r) => pubServer.listen(0, r));
    pub = `http://127.0.0.1:${pubServer.address().port}/api/bookings`;
  });
  test.after(async () => {
    await new Promise((r) => server.close(r));
    await new Promise((r) => pubServer.close(r));
    await mongoose.disconnect();
    await mongod.stop();
  });

  const admin = async (method, path, body, role = 'admin', raw = false) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Cookie: cookie(role) } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return raw ? res : { status: res.status, body: await res.json() };
  };
  const S = require('../utils/bookingSchedule');
  const nextWeekday = (offset) => { let d = S.addDays(S.todayInZone(), offset); while (![1, 2, 3, 4, 5].includes(S.weekdayOf(d))) d = S.addDays(d, 1); return d; };
  const book = async (date, startTime, over = {}) => {
    const res = await fetch(pub, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      name: 'Pat Admin-Test', email: 'pat@example.com', phone: '+14155550100', purpose: 'Tax Services', appointmentType: 'consultation', timezone: 'America/Los_Angeles', consent: true, date, startTime, notes: '=HYPERLINK("http://evil")', ...over }) });
    return res.json();
  };

  test('every admin route needs a signed-in admin or staff user', async () => {
    assert.equal((await admin('GET', '/', null, null)).status, 401);
    assert.equal((await admin('GET', '/stats', null, null)).status, 401);
    assert.equal((await admin('GET', '/', null, 'client')).status, 403);
    assert.equal((await admin('PUT', '/settings', {}, 'client')).status, 403);
    assert.equal((await admin('GET', '/', null, 'staff')).status, 200);
    // staff can read settings but not change them or the blocks
    assert.equal((await admin('GET', '/settings', null, 'staff')).status, 200);
    assert.equal((await admin('PUT', '/settings', { bookingEnabled: true }, 'staff')).status, 403);
    assert.equal((await admin('POST', '/blocks', { type: 'date', date: nextWeekday(20) }, 'staff')).status, 403);
  });

  test('list, filter, search, stats and CSV export', async () => {
    const d1 = nextWeekday(15);
    let d2 = S.addDays(d1, 1); // the next working day after d1, so the two bookings are on different dates
    while (![1, 2, 3, 4, 5].includes(S.weekdayOf(d2))) d2 = S.addDays(d2, 1);
    await book(d1, '10:00', { name: 'Alice Anderson', email: 'alice@example.com', idempotencyKey: 'adm-key-0001' });
    await book(d2, '11:00', { name: 'Bob Brown', email: 'bob@example.com', purpose: 'Payroll Management', idempotencyKey: 'adm-key-0002' });
    const all = await admin('GET', '/?limit=50');
    assert.equal(all.status, 200);
    assert.equal(all.body.total, 2);
    assert.ok(all.body.bookings.every((b) => b.accessTokenHash === undefined && b.slotKeys === undefined), 'secrets never leave the server');
    assert.equal((await admin('GET', '/?q=alice')).body.total, 1);
    assert.equal((await admin('GET', `/?from=${d2}&to=${d2}`)).body.total, 1);
    assert.equal((await admin('GET', '/?status=cancelled')).body.total, 0);
    assert.equal((await admin('GET', '/?q[$ne]=x')).status, 200, 'operator injection is treated as plain text, not a query');
    const stats = (await admin('GET', '/stats')).body;
    assert.equal(stats.total, 2);
    assert.equal(stats.upcoming, 2);
    const csv = await (await admin('GET', '/export', null, 'admin', true)).text();
    assert.ok(csv.includes('Alice Anderson') && csv.includes('Reference'));
    assert.ok(csv.includes("'=HYPERLINK"), 'formula-looking cells are neutralised in the CSV');
  });

  test('admin can reschedule and cancel; changes email the customer unless silent', async () => {
    const d = nextWeekday(17);
    const created = await book(d, '15:00', { idempotencyKey: 'adm-key-0003', email: 'carol@example.com' });
    const id = (await admin('GET', '/?q=' + created.booking.reference)).body.bookings[0].id;
    sent.length = 0;
    const moved = await admin('POST', `/${id}/reschedule`, { date: d, startTime: '16:00' });
    assert.equal(moved.status, 200, JSON.stringify(moved.body));
    assert.equal(moved.body.booking.localStartTime, '16:00');
    assert.equal(moved.body.booking.rescheduleCount, 1);
    await new Promise((r) => setTimeout(r, 300));
    assert.ok(sent.some((m) => m.to === 'carol@example.com' && /rescheduled/i.test(m.subject)));
    // an admin may move a booking even inside the customer cancellation window; taken slots still conflict
    const clash = await book(d, '16:30', { idempotencyKey: 'adm-key-0004', email: 'dave@example.com' });
    assert.equal(clash.success, true);
    assert.equal((await admin('POST', `/${id}/reschedule`, { date: d, startTime: '16:30' })).status, 409);
    sent.length = 0;
    const cancelled = await admin('POST', `/${id}/cancel`, { reason: 'Customer called', silent: true });
    assert.equal(cancelled.body.booking.status, 'cancelled');
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(sent.length, 0, 'silent cancellation sends no email');
    assert.equal((await admin('POST', `/${id}/cancel`, {})).status, 409);
    assert.ok(cancelled.body.booking.history.some((h) => h.action === 'cancelled' && h.by === 'admin@test.local'), 'the actor is recorded');
    assert.equal((await admin('GET', '/not-an-id')).status, 404);
  });

  test('notes and status updates', async () => {
    const d = nextWeekday(18);
    const created = await book(d, '09:30', { idempotencyKey: 'adm-key-0005' });
    const id = (await admin('GET', '/?q=' + created.booking.reference)).body.bookings[0].id;
    const r = await admin('PATCH', `/${id}`, { internalNotes: 'Called back', status: 'completed' });
    assert.equal(r.body.booking.status, 'completed');
    assert.equal(r.body.booking.internalNotes, 'Called back');
    assert.equal((await admin('PATCH', `/${id}`, { status: 'confirmed' })).status, 400);
  });

  test('settings: validation errors, consistency errors, and changes take effect', async () => {
    const bad = await admin('PUT', '/settings', { appointmentDurationMinutes: 20, openingTime: '25:00' });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.fields.appointmentDurationMinutes && bad.body.fields.openingTime);
    const inconsistent = await admin('PUT', '/settings', { openingTime: '19:00' });
    assert.equal(inconsistent.status, 400);
    assert.ok(inconsistent.body.fields.closingTime);

    const d = nextWeekday(21);
    // shorten the day: 10:00 - 12:30 with lunch 11:00 - 11:30 -> 10:00, 10:30, then 11:30, 12:00
    const ok = await admin('PUT', '/settings', { openingTime: '10:00', closingTime: '12:30', lunchBreak: { start: '11:00', end: '11:30' } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    const slots = (await (await fetch(`${pub}/available-slots?date=${d}`)).json()).slots.filter((s) => s.available).map((s) => s.startTime);
    assert.deepEqual(slots, ['10:00', '10:30', '11:30', '12:00']);
    // restore the business defaults
    await admin('PUT', '/settings', { openingTime: '09:30', closingTime: '18:00', lunchBreak: { start: '11:30', end: '12:30' } });
    const again = (await (await fetch(`${pub}/available-slots?date=${d}`)).json()).slots.filter((s) => s.available);
    assert.equal(again.length, 15);
    // a holiday closes a day for the public
    const hol = nextWeekday(22);
    await admin('PUT', '/settings', { holidays: [hol] });
    assert.equal((await (await fetch(`${pub}/available-slots?date=${hol}`)).json()).dateAvailable, false);
    await admin('PUT', '/settings', { holidays: [] });
  });

  test('blocks: created, listed, honoured by the public API, and removed', async () => {
    const d = nextWeekday(23);
    const created = await admin('POST', '/blocks', { type: 'slot', date: d, startTime: '15:00', endTime: '16:00', reason: 'Dentist' });
    assert.equal(created.status, 201);
    assert.equal((await admin('POST', '/blocks', { type: 'slot', date: d, startTime: '16:00', endTime: '15:00' })).status, 400);
    assert.equal((await admin('GET', '/blocks')).body.blocks.length >= 1, true);
    const slots = (await (await fetch(`${pub}/available-slots?date=${d}`)).json()).slots;
    assert.equal(slots.find((s) => s.startTime === '15:00').available, false);
    assert.equal((await admin('DELETE', `/blocks/${created.body.block.id}`)).status, 200);
    const after = (await (await fetch(`${pub}/available-slots?date=${d}`)).json()).slots;
    assert.equal(after.find((s) => s.startTime === '15:00').available, true);
    assert.equal((await admin('DELETE', `/blocks/${created.body.block.id}`)).status, 404);
  });
}
