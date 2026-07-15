const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

/**
 * One-time passcode for passwordless client auth. The code itself is never
 * stored — only a salted SHA-256 hash. Short-lived (5 min) with attempt +
 * resend caps enforced in the service layer.
 */
const otpSchema = new mongoose.Schema({
  email:        { type: String, required: true, lowercase: true, trim: true, index: true },
  code_hash:    { type: String, required: true },
  purpose:      { type: String, default: 'login' },     // 'login' | 'register'
  attempts:     { type: Number, default: 0 },
  resend_count: { type: Number, default: 0 },
  last_sent_at: { type: Date, default: Date.now },
  expires_at:   { type: Date, required: true },
  consumed:     { type: Boolean, default: false },
  created_at:   { type: Date, default: Date.now }
}, schemaOptions);

// TTL index: expired OTP docs are auto-removed by MongoDB.
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

otpSchema.plugin(autoIncrement, { modelName: 'Otp' });

module.exports = mongoose.model('Otp', otpSchema);
