const bcrypt = require('bcryptjs');
const otpService = require('../services/otpService');
const clientAuthService = require('../services/clientAuthService');
const authController = require('./authController');
const { Client, Admin, ActivityLog } = require('../models');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** POST /api/auth/otp/send  { email } — generate + email a login code. */
exports.sendOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  try {
    const admin = await Admin.findOne({ email });
    if (admin) return res.status(403).json({ error: 'This email uses admin login. Please sign in at the admin portal.' });

    const r = await otpService.requestOtp(email, 'login');
    res.json({
      message: r.emailed ? 'A login code has been sent to your email.' : 'A login code has been generated.',
      emailed: r.emailed,
      resendInSec: r.resendInSec,
      expiresInSec: r.expiresInSec,
      ...(r.devCode ? { devCode: r.devCode } : {}),   // dev-only helper when email isn't configured
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to send code', ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}) });
  }
};

/** POST /api/auth/otp/verify  { email, code } — verify + create session. */
exports.verifyOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });
  try {
    await otpService.verifyOtp(email, code, 'login');
    const { client, isNew } = await clientAuthService.loginClientByIdentity(res, { email, method: 'otp' });
    res.json({
      message: 'Verified successfully.',
      isNew,
      user: { id: client.id, first_name: client.first_name, last_name: client.last_name, email: client.email, role: 'client' },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Verification failed' });
  }
};

// Resend is identical to send (the service enforces the cooldown).
exports.resendOtp = exports.sendOtp;

// ── Mandatory email OTP verification for NEW client registration ──
// The account is only created after a valid code is verified. Registration
// details stay on the client until then; nothing is persisted pre-verification.

/** POST /api/auth/register/send-otp  { email } — start OTP-verified signup. */
exports.registerSendOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  try {
    const admin = await Admin.findOne({ email });
    if (admin) return res.status(403).json({ error: 'This email uses admin login. Please sign in at the admin portal.' });
    const existing = await Client.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered. Please sign in instead.' });

    const r = await otpService.requestOtp(email, 'register');
    res.json({
      message: r.emailed ? 'A verification code has been sent to your email.' : 'A verification code has been generated.',
      emailed: r.emailed,
      resendInSec: r.resendInSec,
      expiresInSec: r.expiresInSec,
      ...(r.devCode ? { devCode: r.devCode } : {}),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to send code', ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}) });
  }
};

// Resend is identical to send (the service enforces cooldown + resend caps).
exports.registerResendOtp = exports.registerSendOtp;

/** POST /api/auth/register/verify  { first_name, last_name, email, phone, company_name, password, code }
 *  — verify the code, THEN create the account, mark the email verified, and log in. */
exports.registerVerify = async (req, res) => {
  const { first_name, last_name, phone, company_name, password } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase();
  const code  = String(req.body.code || '').trim();

  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (String(password).length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!code)
    return res.status(400).json({ error: 'Verification code is required' });

  try {
    const admin = await Admin.findOne({ email });
    if (admin) return res.status(403).json({ error: 'This email uses admin login. Please sign in at the admin portal.' });
    const existing = await Client.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered. Please sign in instead.' });

    // Throws on invalid / expired / too-many-attempts / wrong-purpose code.
    await otpService.verifyOtp(email, code, 'register');

    const hash = await bcrypt.hash(String(password), 12);
    const client = await Client.create({
      first_name:   String(first_name).trim(),
      last_name:    String(last_name).trim(),
      email,
      password_hash: hash,
      phone:        phone ? String(phone).trim() : null,
      company_name: company_name ? String(company_name).trim() : null,
      is_verified:  true,          // email proven via OTP — no email-link step needed
      email_verified: true,
      otp_verified: true,
      login_method: 'password',
      last_login:   new Date(),
    });

    authController.issueToken(res, { id: client.id, email: client.email, role: 'client' });

    ActivityLog.create({
      admin_id: null, action: 'client_register_otp', entity_type: 'client', entity_id: client.id,
      meta: { email_verified: true },
    }).catch(err => console.error('register audit log failed:', err.message));

    res.status(201).json({
      message: 'Account created.',
      user: {
        id: client.id, first_name: client.first_name, last_name: client.last_name,
        email: client.email, company_name: client.company_name,
        is_verified: client.is_verified, role: 'client',
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Registration failed' });
  }
};
