const mongoose = require('mongoose');
const { DEFAULT_SETTINGS } = require('../utils/bookingSchedule');

// A single document (key: 'default') holding the business scheduling rules. Missing fields fall back to
// DEFAULT_SETTINGS in utils/bookingSchedule.js, so the system works before an admin ever saves anything.
const typeSchema = new mongoose.Schema({
  id: String, label: String, durationMinutes: Number, enabled: { type: Boolean, default: true },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  key:             { type: String, default: 'default', unique: true },
  timezone:        { type: String, default: DEFAULT_SETTINGS.timezone },
  bookingEnabled:  { type: Boolean, default: true },
  workingDays:     { type: [Number], default: DEFAULT_SETTINGS.workingDays },
  openingTime:     { type: String, default: DEFAULT_SETTINGS.openingTime },
  closingTime:     { type: String, default: DEFAULT_SETTINGS.closingTime },
  lunchBreak:      { start: { type: String, default: DEFAULT_SETTINGS.lunchBreak.start }, end: { type: String, default: DEFAULT_SETTINGS.lunchBreak.end } },
  appointmentDurationMinutes: { type: Number, default: DEFAULT_SETTINGS.appointmentDurationMinutes },
  slotIntervalMinutes:        { type: Number, default: DEFAULT_SETTINGS.slotIntervalMinutes },
  minAdvanceNoticeMinutes:    { type: Number, default: DEFAULT_SETTINGS.minAdvanceNoticeMinutes },
  maxAdvanceDays:             { type: Number, default: DEFAULT_SETTINGS.maxAdvanceDays },
  cancellationNoticeHours:    { type: Number, default: DEFAULT_SETTINGS.cancellationNoticeHours },
  holidays:        { type: [String], default: [] },
  appointmentTypes: { type: [typeSchema], default: DEFAULT_SETTINGS.appointmentTypes },
  adminNotificationEmail: { type: String, default: '' },
  updated_at:      { type: Date, default: Date.now },
  updatedBy:       { type: String, default: '' },
});

module.exports = mongoose.model('BookingSettings', settingsSchema);
