const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            20,
  message:        { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:  false
});

const apiLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            200,
  message:        { error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders:  false
});

// Tighter limiter for OTP send/verify (brute-force + abuse protection).
const otpLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            15,
  message:        { error: 'Too many OTP requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:  false
});

module.exports = { authLimiter, apiLimiter, otpLimiter };
