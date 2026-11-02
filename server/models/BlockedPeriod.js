const mongoose = require('mongoose');
const schemaOptions = require('./schemaOptions');

// A period an admin has made unbookable: a whole day (type 'date') or a stretch of time (type 'slot').
const blockedPeriodSchema = new mongoose.Schema({
  type:       { type: String, enum: ['date', 'slot'], required: true },
  localDate:  { type: String, required: true },   // YYYY-MM-DD in the business timezone
  startAtUtc: { type: Date, required: true },
  endAtUtc:   { type: Date, required: true },
  reason:     { type: String, default: '', maxlength: 200 },
  createdBy:  { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
}, schemaOptions);

blockedPeriodSchema.index({ startAtUtc: 1, endAtUtc: 1 });
blockedPeriodSchema.index({ localDate: 1 });

module.exports = mongoose.model('BlockedPeriod', blockedPeriodSchema);
