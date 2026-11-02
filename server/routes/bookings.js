const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const svc = require('../services/bookingService');
const notify = require('../services/bookingNotify');

// Public booking API. Availability is always calculated on the server; the browser only displays it.
const readLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: { error: 'Too many requests. Please try again shortly.' }, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.BOOKING_WRITE_LIMIT) || 12, message: { error: 'Too many booking attempts. Please try again later or call (510) 962-7300.' }, standardHeaders: true, legacyHeaders: false });

const str = (v) => (typeof v === 'string' ? v : '');

// Turn thrown errors into JSON. Anything unexpected is logged and reported without internals.
function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof svc.BookingError) {
        return res.status(err.status).json({ error: err.message, ...(err.code ? { code: err.code } : {}), ...(err.fields ? { fields: err.fields } : {}) });
      }
      console.error('[booking] unexpected error:', err);
      return res.status(500).json({ error: 'Something went wrong on our side. Please try again, or call (510) 962-7300.' });
    }
  };
}

router.get('/config', readLimiter, handle(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(svc.publicConfig(await svc.getSettings()));
}));

router.get('/available-dates', readLimiter, handle(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await svc.getAvailableDates(str(req.query.month)));
}));

router.get('/available-slots', readLimiter, handle(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await svc.getAvailableSlots(str(req.query.date), { typeId: str(req.query.type) }));
}));

router.post('/', writeLimiter, handle(async (req, res) => {
  const b = req.body || {};
  // Honeypot: people never fill this hidden field. Pretend success so bots move on.
  if (b.website) return res.status(201).json({ success: true, booking: { reference: 'BK-PENDING', status: 'confirmed' } });

  const { booking, accessToken, duplicate } = await svc.createBooking(b);
  const settings = await svc.getSettings();
  if (!duplicate) notify.afterCreate(booking, accessToken, settings); // runs in the background; failures are recorded, not thrown
  res.status(duplicate ? 200 : 201).json({
    success: true,
    duplicate,
    booking: svc.toPublic(booking, settings),
    ...(accessToken ? { accessToken } : {}),
  });
}));

router.get('/:reference', readLimiter, handle(async (req, res) => {
  const booking = await svc.findForCustomer(req.params.reference, str(req.query.token));
  res.set('Cache-Control', 'no-store');
  res.json({ booking: svc.toPublic(booking, await svc.getSettings()) });
}));

router.post('/:reference/cancel', writeLimiter, handle(async (req, res) => {
  const booking = await svc.findForCustomer(req.params.reference, str(req.body && req.body.token));
  const cancelled = await svc.cancelBooking(booking, { by: 'customer', reason: str(req.body && req.body.reason) });
  const settings = await svc.getSettings();
  notify.afterChange(cancelled, { kind: 'cancelled', by: 'customer', settings });
  res.json({ success: true, booking: svc.toPublic(cancelled, settings) });
}));

router.post('/:reference/reschedule', writeLimiter, handle(async (req, res) => {
  const body = req.body || {};
  const booking = await svc.findForCustomer(req.params.reference, str(body.token));
  const { booking: moved, accessToken, previous } = await svc.rescheduleBooking(booking, { date: str(body.date), startTime: str(body.startTime), by: 'customer' });
  const settings = await svc.getSettings();
  notify.afterChange(moved, { kind: 'rescheduled', token: accessToken, by: 'customer', previous, settings });
  res.json({ success: true, booking: svc.toPublic(moved, settings), accessToken });
}));

module.exports = router;
