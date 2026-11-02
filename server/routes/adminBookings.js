const router = require('express').Router();
const mongoose = require('mongoose');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const BlockedPeriod = require('../models/BlockedPeriod');
const Booking = require('../models/Booking');
const svc = require('../services/bookingService');
const notify = require('../services/bookingNotify');

// Admin booking management. Authentication and role checks run on the server for every route here.
router.use(requireAuth, requireRole('admin', 'staff'));

const str = (v) => (typeof v === 'string' ? v : '');
const actor = (req) => String((req.user && (req.user.email || req.user.name || req.user.id)) || 'admin');
const onlyAdmin = requireRole('admin');

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof svc.BookingError) {
        return res.status(err.status).json({ error: err.message, ...(err.code ? { code: err.code } : {}), ...(err.fields ? { fields: err.fields } : {}) });
      }
      console.error('[admin bookings] unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

const loadBooking = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new svc.BookingError(404, 'Booking not found.');
  const b = await Booking.findById(id);
  if (!b) throw new svc.BookingError(404, 'Booking not found.');
  return b;
};

const adminView = (b) => ({ ...b.toObject(), accessTokenHash: undefined, slotKeys: undefined });

router.get('/stats', handle(async (req, res) => { res.json(await svc.bookingStats()); }));

router.get('/export', handle(async (req, res) => {
  const csv = await svc.exportCsv({ q: str(req.query.q), status: str(req.query.status), type: str(req.query.type), from: str(req.query.from), to: str(req.query.to) });
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bookings.csv"' });
  res.send(`﻿${csv}`);
}));

router.get('/settings', handle(async (req, res) => { res.json({ settings: await svc.getSettings() }); }));
router.put('/settings', onlyAdmin, handle(async (req, res) => { res.json({ settings: await svc.updateSettings(req.body, actor(req)) }); }));

router.get('/blocks', handle(async (req, res) => { res.json({ blocks: await svc.listBlocks(str(req.query.from)) }); }));
router.post('/blocks', onlyAdmin, handle(async (req, res) => {
  const b = req.body || {};
  res.status(201).json({ block: await svc.createBlock({ type: str(b.type), date: str(b.date), startTime: str(b.startTime), endTime: str(b.endTime), reason: str(b.reason) }, actor(req)) });
}));
router.delete('/blocks/:id', onlyAdmin, handle(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new svc.BookingError(404, 'Block not found.');
  const removed = await BlockedPeriod.findByIdAndDelete(req.params.id);
  if (!removed) throw new svc.BookingError(404, 'Block not found.');
  res.json({ success: true });
}));

router.get('/', handle(async (req, res) => {
  const q = req.query;
  const { items, total, page, pages } = await svc.listBookings({ q: str(q.q), status: str(q.status), type: str(q.type), from: str(q.from), to: str(q.to), page: str(q.page), limit: str(q.limit), sort: str(q.sort) });
  res.json({ bookings: items.map(adminView), total, page, pages });
}));

router.get('/:id', handle(async (req, res) => { res.json({ booking: adminView(await loadBooking(req.params.id)) }); }));

router.patch('/:id', handle(async (req, res) => {
  await loadBooking(req.params.id);
  const b = req.body || {};
  res.json({ booking: adminView(await svc.updateBookingAdmin(req.params.id, { status: b.status === undefined ? undefined : str(b.status), internalNotes: b.internalNotes === undefined ? undefined : str(b.internalNotes) }, actor(req))) });
}));

router.post('/:id/cancel', handle(async (req, res) => {
  const booking = await loadBooking(req.params.id);
  const cancelled = await svc.cancelBooking(booking, { by: actor(req), admin: true, reason: str(req.body && req.body.reason) });
  const settings = await svc.getSettings();
  if (!(req.body && req.body.silent === true)) notify.afterChange(cancelled, { kind: 'cancelled', by: actor(req), settings });
  res.json({ booking: adminView(cancelled) });
}));

router.post('/:id/reschedule', handle(async (req, res) => {
  const booking = await loadBooking(req.params.id);
  const b = req.body || {};
  const { booking: moved, accessToken, previous } = await svc.rescheduleBooking(booking, { date: str(b.date), startTime: str(b.startTime), by: actor(req), admin: true });
  const settings = await svc.getSettings();
  if (!(b.silent === true)) notify.afterChange(moved, { kind: 'rescheduled', token: accessToken, by: actor(req), previous, settings });
  res.json({ booking: adminView(moved) });
}));

module.exports = router;
