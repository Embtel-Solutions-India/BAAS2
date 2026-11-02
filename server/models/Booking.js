const mongoose = require('mongoose');
const schemaOptions = require('./schemaOptions');

// One appointment. Times are stored as UTC instants; `timezone` is the business zone the customer booked in.
// `slotKeys` lists every 15-minute cell the appointment occupies. A partial unique index over them (confirmed
// bookings only) lets MongoDB itself reject two overlapping bookings, so a race between two customers can only
// ever produce one winner.
const notifySchema = new mongoose.Schema({
  status:  { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  sentAt:  { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  error:   { type: String, default: '' },
}, { _id: false });

const historySchema = new mongoose.Schema({
  at:     { type: Date, default: Date.now },
  action: { type: String, required: true },
  by:     { type: String, default: 'customer' },
  detail: { type: String, default: '' },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  reference:       { type: String, required: true, unique: true },
  accessTokenHash: { type: String, required: true, select: false },
  idempotencyKey:  { type: String, default: undefined },

  customerName:    { type: String, required: true, trim: true, maxlength: 120 },
  customerEmail:   { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  customerPhone:   { type: String, required: true, trim: true, maxlength: 30 },
  companyName:     { type: String, default: '', trim: true, maxlength: 160 },
  purpose:         { type: String, required: true, maxlength: 80 },
  appointmentType: { type: String, required: true, maxlength: 40 },
  appointmentTypeLabel: { type: String, default: '', maxlength: 80 },
  customerNotes:   { type: String, default: '', maxlength: 1500 },
  internalNotes:   { type: String, default: '', maxlength: 3000 },

  startAtUtc:      { type: Date, required: true },
  endAtUtc:        { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  timezone:        { type: String, required: true },
  localDate:       { type: String, required: true },  // YYYY-MM-DD in `timezone`
  localStartTime:  { type: String, required: true },  // HH:mm in `timezone`
  localEndTime:    { type: String, required: true },
  slotKeys:        { type: [String], default: [] },

  status:          { type: String, enum: ['confirmed', 'cancelled', 'completed', 'no_show'], default: 'confirmed' },
  cancelledAt:     { type: Date, default: null },
  cancelledBy:     { type: String, default: '' },
  cancelReason:    { type: String, default: '', maxlength: 300 },
  rescheduleCount: { type: Number, default: 0 },

  notifications: {
    customerConfirmation: { type: notifySchema, default: () => ({}) },
    adminNotification:    { type: notifySchema, default: () => ({}) },
    customerChange:       { type: notifySchema, default: () => ({}) },
  },
  history:         { type: [historySchema], default: [] },

  created_at:      { type: Date, default: Date.now },
  updated_at:      { type: Date, default: Date.now },
}, schemaOptions);

bookingSchema.index({ slotKeys: 1 }, { unique: true, partialFilterExpression: { status: 'confirmed' } });
bookingSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
bookingSchema.index({ startAtUtc: 1, status: 1 });
bookingSchema.index({ customerEmail: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
