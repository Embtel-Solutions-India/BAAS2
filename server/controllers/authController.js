const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { Client, Admin, EmailVerification, PasswordReset, toRow } = require('../models');
const { sendMail } = require('../config/email');

const JWT_SECRET  = process.env.JWT_SECRET  || 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
// CLIENT_URL may be a comma-separated list of allowed origins (used for CORS);
// email links need a single valid base, so take the first origin.
const CLIENT_URL  = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();

// Session-cookie attributes. In production the SPA and API can be served from
// different origins (e.g. www.* page → apex /api), so the cookie must be
// SameSite=None + Secure or browsers won't send it on cross-origin requests.
// SameSite=None REQUIRES Secure, so both are tied to production (HTTPS).
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
};

function issueToken(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.cookie('token', token, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
  return token;
}

// Exposed so logout clears the cookie with the SAME attributes it was set with
// (a mismatch would leave the cookie in place).
exports.COOKIE_OPTS = COOKIE_OPTS;

// Exposed so the additive OTP / OAuth flows mint the identical session cookie.
exports.issueToken = issueToken;

exports.register = async (req, res) => {
  const { first_name, last_name, email, password, phone, company_name } = req.body;
  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const existing = await Client.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const client = new Client({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      phone: phone || null,
      company_name: company_name || null
    });
    await client.save();

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expires     = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const ev = new EmailVerification({
      client_id: client.id,
      token: verifyToken,
      expires_at: expires
    });
    await ev.save();

    const verifyUrl = `${CLIENT_URL}/client-portal/verify-email?token=${verifyToken}`;
    await sendMail({
      to:      email,
      subject: 'Verify your BAAS Portal account',
      html: `<p>Hi ${first_name},</p>
             <p>Click below to verify your email address:</p>
             <p><a href="${verifyUrl}">${verifyUrl}</a></p>
             <p>This link expires in 24 hours.</p>`
    }).catch(() => {});

    // Auto-login: issue token and return user data so frontend can redirect to dashboard
    issueToken(res, { id: client.id, email: client.email, role: 'client' });
    res.status(201).json({
      message: 'Account created.',
      user: {
        id:          client.id,
        first_name:  client.first_name,
        last_name:   client.last_name,
        email:       client.email,
        company_name: client.company_name,
        is_verified: client.is_verified,
        role:        'client'
      }
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });
  try {
    let client = await Client.findOne({ email: email.toLowerCase().trim() });
    let role = 'client';
    if (!client) {
      client = await Admin.findOne({ email: email.toLowerCase().trim() });
      if (client) {
        role = client.role;
      }
    }
    if (!client) return res.status(401).json({ error: 'Invalid credentials' });
    if (!client.is_active) return res.status(403).json({ error: 'Account is disabled. Contact support.' });

    const match = await bcrypt.compare(password, client.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    issueToken(res, { id: client.id, email: client.email, role });
    res.json({
      user: {
        id:          client.id,
        first_name:  client.first_name || client.name.split(' ')[0],
        last_name:   client.last_name || client.name.split(' ').slice(1).join(' ') || '',
        email:       client.email,
        is_verified: role !== 'client' ? true : !!client.is_verified,
        role
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token is required' });
  try {
    const ev = await EmailVerification.findOne({ token, used: false, expires_at: { $gt: new Date() } });
    if (!ev) return res.status(400).json({ error: 'Invalid or expired verification link' });

    await Client.findByIdAndUpdate(ev.client_id, { is_verified: true });
    ev.used = true;
    await ev.save();
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('verifyEmail error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const SAFE_MSG = 'If that email is registered, a reset link has been sent.';
  try {
    const client = await Client.findOne({ email: email.toLowerCase().trim() });
    if (!client) return res.json({ message: SAFE_MSG });

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const pr = new PasswordReset({
      client_id: client.id,
      token,
      expires_at: expires
    });
    await pr.save();

    const resetUrl = `${CLIENT_URL}/client-portal/reset-password?token=${token}`;
    await sendMail({
      to:      email,
      subject: 'Reset your BAAS Portal password',
      html: `<p>Hi ${client.first_name},</p>
             <p>Click below to reset your password:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>`
    }).catch(() => {});

    res.json({ message: SAFE_MSG });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Request failed' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ error: 'Token and new password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const pr = await PasswordReset.findOne({ token, used: false, expires_at: { $gt: new Date() } });
    if (!pr) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const hash = await bcrypt.hash(password, 12);
    await Client.findByIdAndUpdate(pr.client_id, { password_hash: hash });
    pr.used = true;
    await pr.save();
    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ message: 'Logged out successfully' });
};

exports.me = async (req, res) => {
  try {
    if (req.user.role === 'client') {
      const client = await Client.findById(req.user.id);
      if (!client) return res.status(404).json({ error: 'User not found' });
      const row = toRow(client);
      delete row.password_hash;
      res.json({ user: { ...row, role: 'client' } });
    } else {
      const admin = await Admin.findById(req.user.id);
      if (!admin) return res.status(404).json({ error: 'User not found' });
      const row = toRow(admin);
      delete row.password_hash;
      res.json({ user: { ...row, role: admin.role || 'staff' } });
    }
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
