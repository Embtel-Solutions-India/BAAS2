// The consultation booking relay: our server forwards to n8n and passes the answer back. n8n is replaced by a local fake.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const calls = [];
let reply = { status: 200, body: { success: true } };
const pathReplies = {}; // per-path overrides, e.g. an EMPTY booking reply
let fake;
let app;
let base;

test.before(async () => {
  fake = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, type: req.headers['content-type'], body: raw ? JSON.parse(raw) : null });
      const special = pathReplies[req.url.split('?')[0]];
      if (special) { res.writeHead(special.status, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(special.body === undefined ? '' : JSON.stringify(special.body)); }
      if (reply.raw !== undefined) { res.writeHead(reply.status, { 'Content-Type': 'text/html' }); return res.end(reply.raw); }
      res.writeHead(reply.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reply.body));
    });
  });
  await new Promise((r) => fake.listen(0, r));
  process.env.N8N_BOOKING_BASE = `http://127.0.0.1:${fake.address().port}/webhook`;
  process.env.BOOKING_WRITE_LIMIT = '1000';
  process.env.BOOKING_READ_LIMIT = '1000';
  const a = express();
  a.use(express.json());
  a.use('/api/booking', require('../routes/consultationBooking'));
  app = http.createServer(a);
  await new Promise((r) => app.listen(0, r));
  base = `http://127.0.0.1:${app.address().port}/api/booking`;
});
test.after(async () => {
  await new Promise((r) => app.close(r));
  await new Promise((r) => fake.close(r));
});

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
};
const last = () => calls[calls.length - 1];
const days = [{ date: '2026-11-03', slots: ['2026-11-03T09:00:00-08:00', '2026-11-03T09:30:00-08:00'] }];

const goodBooking = (over = {}) => ({
  first_name: 'Priya', last_name: 'Shah', email: 'priya@shahdesign.com', phone: '+15105550123', start_time: '2026-11-03T10:00:00-08:00',
  services: ['Payroll Management', 'Business & Individual Taxes'], message: "I'd like help with payroll.",
  utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'camp-1', gclid: '', referrer: 'https://www.facebook.com/', ...over,
});

test('availability is fetched from n8n and returned unchanged', async () => {
  reply = { status: 200, body: { success: true, timezone: 'America/Los_Angeles', generated_at: 'now', days } };
  const r = await call('GET', '/availability');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.days, days);
  assert.equal(last().method, 'GET');
  assert.equal(last().url, '/webhook/baas-free-slots');
  assert.equal(r.cache, 'no-store');
});

test('booking forwards every field and all five tracking keys, exactly as received', async () => {
  reply = { status: 200, body: { success: true, booking_id: 'aB12cD34eF56gH78iJ90', booking_status: 'booked', appointment_start: '2026-11-03T10:00:00-08:00', meeting_link: 'https://meet.google.com/abc-defg-hij', timezone: 'America/Los_Angeles', days } };
  const r = await call('POST', '/', goodBooking());
  assert.equal(r.status, 200);
  assert.equal(r.body.booking_id, 'aB12cD34eF56gH78iJ90');
  assert.equal(last().method, 'POST');
  assert.equal(last().url, '/webhook/baas-consultation');
  assert.match(last().type, /application\/json/);
  assert.deepEqual(last().body, {
    first_name: 'Priya', last_name: 'Shah', email: 'priya@shahdesign.com', phone: '+15105550123', start_time: '2026-11-03T10:00:00-08:00',
    services: ['Business & Individual Taxes', 'Payroll Management'], message: "I'd like help with payroll.",
    utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'camp-1', gclid: '', referrer: 'https://www.facebook.com/',
  });
});

test('missing tracking keys and an empty message are sent as empty strings; services may be empty', async () => {
  reply = { status: 200, body: { success: true } };
  await call('POST', '/', { first_name: 'A', last_name: 'B', email: 'a@b.co', phone: '+15105550123', start_time: '2026-11-03T10:00:00-08:00' });
  assert.deepEqual(last().body, {
    first_name: 'A', last_name: 'B', email: 'a@b.co', phone: '+15105550123', start_time: '2026-11-03T10:00:00-08:00', services: [], message: '',
    utm_source: '', utm_medium: '', utm_campaign: '', gclid: '', referrer: '',
  });
});

test('a taken time comes back as success:false with fresh days (HTTP 200)', async () => {
  reply = { status: 200, body: { success: false, message: 'Sorry, that time was just taken. Please choose another time.', booking_id: '', booking_status: 'failed', days } };
  const r = await call('POST', '/', goodBooking());
  assert.equal(r.status, 200);
  assert.equal(r.body.success, false);
  assert.deepEqual(r.body.days, days);
});

test('invalid booking details are rejected before n8n is called', async () => {
  const before = calls.length;
  const bad = async (over, text) => {
    const r = await call('POST', '/', goodBooking(over));
    assert.equal(r.status, 400, text);
    assert.equal(r.body.success, false);
    assert.ok(r.body.message);
  };
  await bad({ first_name: '' }, 'no first name');
  await bad({ last_name: '   ' }, 'no last name');
  await bad({ email: 'nope' }, 'bad email');
  await bad({ phone: '5105550123' }, 'phone without country code');
  await bad({ start_time: '' }, 'no start time');
  await bad({ start_time: 'tomorrow at 10' }, 'start time not from the list shape');
  await bad({ services: ['Web Design'] }, 'service not in the list');
  await bad({ services: 'Payroll Management' }, 'services not a list');
  assert.equal(calls.length, before, 'nothing was forwarded');
});

test('the honeypot answers without calling n8n', async () => {
  const before = calls.length;
  const r = await call('POST', '/', goodBooking({ website: 'http://spam' }));
  assert.equal(r.body.success, false);
  assert.equal(calls.length, before);
});

test('confirmation passes the booking id as a query parameter and relays 200 and 404', async () => {
  reply = { status: 200, body: { success: true, booking_id: 'aB12cD34eF56gH78iJ90', status: 'booked', start_time: '2026-11-03T10:00:00-08:00', end_time: '2026-11-03T10:30:00-08:00', timezone: 'America/Los_Angeles', name: 'Priya Shah', meeting_link: 'https://meet.google.com/abc-defg-hij' } };
  const ok = await call('GET', '/confirmation/aB12cD34eF56gH78iJ90');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.meeting_link, 'https://meet.google.com/abc-defg-hij');
  assert.equal(last().url, '/webhook/baas-booking-confirmation?booking_id=aB12cD34eF56gH78iJ90');
  reply = { status: 404, body: { success: false, message: 'We could not find this booking.' } };
  const nf = await call('GET', '/confirmation/doesNotExist123');
  assert.equal(nf.status, 404);
  assert.equal(nf.body.message, 'We could not find this booking.');
  const before = calls.length;
  assert.equal((await call('GET', '/confirmation/' + encodeURIComponent('a b&x=1'))).status, 400, 'odd ids never reach n8n');
  assert.equal(calls.length, before);
});

test('cancel needs booking_id and email, and relays 200, 404 and 409 unchanged', async () => {
  assert.equal((await call('POST', '/cancel', { booking_id: 'aB12cD34eF56gH78iJ90' })).status, 400);
  assert.equal((await call('POST', '/cancel', { email: 'priya@shahdesign.com' })).status, 400);
  reply = { status: 200, body: { success: true, message: 'Your consultation has been cancelled.', booking_status: 'cancelled', days } };
  const ok = await call('POST', '/cancel', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com', extra: 'ignored' });
  assert.equal(ok.body.booking_status, 'cancelled');
  assert.equal(last().url, '/webhook/baas-booking-cancel');
  assert.deepEqual(last().body, { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com' });
  reply = { status: 409, body: { success: false, message: 'This booking is already cancelled.' } };
  const conflict = await call('POST', '/cancel', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com' });
  assert.equal(conflict.status, 409);
  reply = { status: 404, body: { success: false, message: 'We could not find a booking with these details.' } };
  assert.equal((await call('POST', '/cancel', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'wrong@example.com' })).status, 404);
  reply = { status: 502, body: { success: false, message: 'Sorry, we could not cancel this booking right now. Please try again or contact us.', days } };
  const bad = await call('POST', '/cancel', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com' });
  assert.equal(bad.status, 502);
  assert.deepEqual(bad.body.days, days, 'even a 502 hands back the free times');
});

test('reschedule forwards the new start_time exactly and relays 200, 409 and 400', async () => {
  assert.equal((await call('POST', '/reschedule', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com' })).status, 400);
  assert.equal((await call('POST', '/reschedule', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com', start_time: 'soon' })).status, 400);
  reply = { status: 200, body: { success: true, message: 'Your consultation has been rescheduled.', booking_status: 'booked', appointment_start: '2026-11-04T09:00:00-08:00', days } };
  const ok = await call('POST', '/reschedule', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com', start_time: '2026-11-04T09:00:00-08:00' });
  assert.equal(ok.body.appointment_start, '2026-11-04T09:00:00-08:00');
  assert.equal(last().url, '/webhook/baas-booking-reschedule');
  assert.deepEqual(last().body, { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com', start_time: '2026-11-04T09:00:00-08:00' });
  reply = { status: 409, body: { success: false, booking_status: 'unchanged', message: 'Sorry, that time was just taken. Please choose another time. Your original booking is unchanged.', days } };
  const taken = await call('POST', '/reschedule', { booking_id: 'aB12cD34eF56gH78iJ90', email: 'priya@shahdesign.com', start_time: '2026-11-04T09:00:00-08:00' });
  assert.equal(taken.status, 409);
  assert.equal(taken.body.booking_status, 'unchanged');
});

test('services are returned from the website without calling n8n', async () => {
  const before = calls.length;
  const r = await call('GET', '/services');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.session, { name: 'Free 1-to-1 Session', duration_minutes: 30, price: 0, timezone: 'America/Los_Angeles' });
  assert.deepEqual(r.body.services, ['Bookkeeping & Accounting', 'Business & Individual Taxes', 'Payroll Management', 'Accounting Cleanup', 'Business Formation & Consulting', 'Registered Agent Services', 'Bookkeeping Cleanup & Catch-Up']);
  assert.equal(calls.length, before);
});

test('n8n failures become a clean 502 with no internals', async () => {
  reply = { status: 200, raw: '<html>gateway error</html>' };
  const html = await call('GET', '/availability');
  assert.equal(html.status, 502);
  assert.equal(html.body.success, false);
  assert.ok(!/html|gateway/i.test(html.body.message));
  // n8n unreachable
  const saved = process.env.N8N_BOOKING_BASE;
  delete require.cache[require.resolve('../routes/consultationBooking')];
  process.env.N8N_BOOKING_BASE = 'http://127.0.0.1:1/webhook';
  const a = express();
  a.use('/api/booking', require('../routes/consultationBooking'));
  const srv = http.createServer(a);
  await new Promise((r) => srv.listen(0, r));
  const res = await fetch(`http://127.0.0.1:${srv.address().port}/api/booking/availability`);
  const body = await res.json();
  await new Promise((r) => srv.close(r));
  process.env.N8N_BOOKING_BASE = saved;
  assert.equal(res.status, 502);
  assert.equal(body.success, false);
});

test('write endpoints are rate limited', async () => {
  delete require.cache[require.resolve('../routes/consultationBooking')];
  process.env.BOOKING_WRITE_LIMIT = '3';
  const a = express();
  a.use(express.json());
  a.use('/api/booking', require('../routes/consultationBooking'));
  const srv = http.createServer(a);
  await new Promise((r) => srv.listen(0, r));
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await fetch(`http://127.0.0.1:${srv.address().port}/api/booking/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status);
  await new Promise((r) => srv.close(r));
  process.env.BOOKING_WRITE_LIMIT = '1000';
  assert.deepEqual(statuses, [400, 400, 400, 429, 429]);
});

test('an empty 200 reply to a booking (as the live system gives) is recovered from the free list, never shown as a failure', async () => {
  const start = '2026-11-03T10:00:00-08:00';
  pathReplies['/webhook/baas-consultation'] = { status: 200 }; // 200, JSON content type, zero bytes
  const stillThere = [{ date: '2026-11-03', slots: [start, '2026-11-03T10:30:00-08:00'] }];
  const gone = [{ date: '2026-11-03', slots: ['2026-11-03T10:30:00-08:00'] }];

  // the chosen time disappeared from the free list: the booking went through
  pathReplies['/webhook/baas-free-slots'] = { status: 200, body: { success: true, timezone: 'America/Los_Angeles', generated_at: 'now', days: gone } };
  const ok = await call('POST', '/', goodBooking({ start_time: start }));
  assert.equal(ok.status, 200);
  assert.equal(ok.body.success, true);
  assert.equal(ok.body.booking_status, 'booked');
  assert.equal(ok.body.appointment_start, start);
  assert.equal(ok.body.booking_id, '');
  assert.equal(ok.body.confirmation_pending, true);
  assert.deepEqual(ok.body.days, gone, 'the fresh free list is handed back');

  // the time is still free: not confirmed, and never reported as a plain failure
  pathReplies['/webhook/baas-free-slots'] = { status: 200, body: { success: true, timezone: 'America/Los_Angeles', generated_at: 'now', days: stillThere } };
  const unconfirmed = await call('POST', '/', goodBooking({ start_time: start }));
  assert.equal(unconfirmed.body.success, false);
  assert.equal(unconfirmed.body.booking_status, 'unconfirmed');
  assert.match(unconfirmed.body.message, /before booking again/);

  // the free list cannot be read either: a clean 502
  pathReplies['/webhook/baas-free-slots'] = { status: 500 };
  const down = await call('POST', '/', goodBooking({ start_time: start }));
  assert.equal(down.status, 502);

  delete pathReplies['/webhook/baas-consultation'];
  delete pathReplies['/webhook/baas-free-slots'];
});
