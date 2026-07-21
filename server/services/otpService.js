const crypto = require('crypto');
const { Otp } = require('../models');
const { sendMail } = require('../config/email');

const EXPIRY_MS   = 5 * 60 * 1000;   // OTP valid 5 minutes
const COOLDOWN_MS = 60 * 1000;       // min gap between sends (resend timer)
const MAX_RESEND  = 5;               // max sends per active window
const MAX_ATTEMPTS = 5;              // max verify attempts per code
const MAX_FAILED_TOTAL = 10;         // hard ceiling on wrong guesses across resends before lockout
const LOCK_MS = 15 * 60 * 1000;      // per-email lockout duration once the ceiling is hit
const PEPPER = process.env.JWT_SECRET || 'dev_secret';

const normEmail = (email) => String(email || '').toLowerCase().trim();

function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

// Bind the hash to the email AND purpose so a code minted for one identity or
// flow can never validate for another, even if a lookup is ever mis-scoped.
function hashCode(code, email, purpose) {
  return crypto.createHash('sha256').update(`${code}:${normEmail(email)}:${purpose}:${PEPPER}`).digest('hex');
}

function safeEqualHex(a, b) {
  const ba = Buffer.from(a, 'hex'), bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function httpError(status, message, extra = {}) {
  const e = new Error(message); e.status = status; Object.assign(e, extra); return e;
}

async function sendOtpEmail(email, code, purpose = 'login') {
  const isRegister = purpose === 'register';
  const intro   = isRegister ? 'Your email verification code is:' : 'Your one-time login code is:';
  const footer  = isRegister
    ? 'Use this code to finish creating your account. It expires in 5 minutes. If you didn’t request it, you can safely ignore this email — no account will be created.'
    : 'If you didn’t request this code, you can safely ignore this email. Never share this code with anyone — our team will never ask for it.';
  const subject = isRegister ? `${code} is your BAAS verification code` : `${code} is your BAAS login code`;
  const html = `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f8f6;border-radius:16px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#d4001f,#a4001a);color:#fff;font-family:Georgia,serif;font-size:24px;font-weight:700">B</div>
        <div style="font-size:16px;font-weight:700;color:#111;margin-top:10px">Bay Area Accounting Solutions</div>
      </div>
      <div style="background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:14px;padding:28px;text-align:center">
        <p style="font-size:15px;color:#444;margin:0 0 16px">${intro}</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#d4001f;margin:8px 0 16px">${code}</div>
        <p style="font-size:13px;color:#888;margin:0">This code expires in 5 minutes.</p>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.6;margin-top:20px;text-align:center">
        ${footer}
      </p>
    </div>`;
  return sendMail({ to: email, subject, html });
}

/**
 * Create (or refresh) an OTP for an email and email it.
 * Enforces a resend cooldown and per-window resend cap.
 * Returns { emailed, expiresInSec, resendInSec, devCode? } — devCode is only
 * populated outside production when email delivery is unavailable.
 */
async function requestOtp(email, purpose = 'login') {
  email = normEmail(email);
  const now = Date.now();
  let otp = await Otp.findOne({ email, consumed: false }).sort({ created_at: -1 });

  // Per-email lockout (survives resends and is IP-independent) blocks new codes too.
  if (otp && otp.lock_until && otp.lock_until.getTime() > now) {
    const secs = Math.ceil((otp.lock_until.getTime() - now) / 1000);
    throw httpError(429, `Too many attempts. Please try again in ${Math.ceil(secs / 60)} minute(s).`, { retryAfter: secs });
  }

  if (otp && otp.expires_at.getTime() > now) {
    const since = now - otp.last_sent_at.getTime();
    if (since < COOLDOWN_MS) {
      throw httpError(429, `Please wait ${Math.ceil((COOLDOWN_MS - since) / 1000)}s before requesting another code.`, { retryAfter: Math.ceil((COOLDOWN_MS - since) / 1000) });
    }
    if (otp.resend_count >= MAX_RESEND) {
      throw httpError(429, 'Too many codes requested. Please try again in a few minutes.');
    }
  }

  const code = generateCode();
  const code_hash = hashCode(code, email, purpose);
  const expires_at = new Date(now + EXPIRY_MS);

  if (otp && otp.expires_at.getTime() > now) {
    // Reset per-code attempts for legit UX, but PRESERVE failed_total so the
    // hard ceiling can't be bypassed by simply requesting another code.
    otp.code_hash = code_hash; otp.expires_at = expires_at; otp.attempts = 0;
    otp.last_sent_at = new Date(); otp.resend_count += 1; otp.purpose = purpose;
    await otp.save();
  } else {
    otp = await Otp.create({ email, code_hash, expires_at, purpose, last_sent_at: new Date() });
  }

  let emailed = false;
  try {
    await sendOtpEmail(email, code, purpose);
    emailed = true;
  } catch (err) {
    console.error(`OTP email to ${email} failed:`, err.message);
    if (process.env.NODE_ENV !== 'production') console.log(`[DEV] OTP for ${email}: ${code}`);
  }

  return {
    emailed,
    expiresInSec: EXPIRY_MS / 1000,
    resendInSec: COOLDOWN_MS / 1000,
    devCode: (!emailed && process.env.NODE_ENV !== 'production') ? code : undefined,
  };
}

/**
 * Verify a submitted code. Throws on invalid/expired/too-many-attempts.
 * Pass `expectedPurpose` (e.g. 'register') to reject a code minted for a
 * different flow, so a login code can't create an account and vice-versa.
 */
async function verifyOtp(email, code, expectedPurpose = null) {
  email = normEmail(email);
  const now = Date.now();
  const otp = await Otp.findOne({ email, consumed: false }).sort({ created_at: -1 });
  if (!otp) throw httpError(400, 'No active code. Please request a new one.');

  // Lockout is checked first so it can't be side-stepped by any later branch.
  if (otp.lock_until && otp.lock_until.getTime() > now) {
    const secs = Math.ceil((otp.lock_until.getTime() - now) / 1000);
    throw httpError(429, `Too many attempts. Please try again in ${Math.ceil(secs / 60)} minute(s).`, { retryAfter: secs });
  }
  if (expectedPurpose && otp.purpose !== expectedPurpose) throw httpError(400, 'No active code for this action. Please request a new one.');
  if (otp.expires_at.getTime() < now) throw httpError(400, 'Code expired. Please request a new one.');
  if (otp.attempts >= MAX_ATTEMPTS) throw httpError(429, 'Too many incorrect attempts. Please request a new code.');

  if (!safeEqualHex(hashCode(String(code), email, otp.purpose), otp.code_hash)) {
    otp.attempts += 1;
    otp.failed_total += 1;

    // Hard, cross-resend ceiling → lock this email out for a fixed window.
    // Keep the row alive until the lock ends (TTL uses expires_at) so the
    // lockout survives and can't be reset by requesting a fresh code.
    if (otp.failed_total >= MAX_FAILED_TOTAL) {
      otp.lock_until = new Date(now + LOCK_MS);
      otp.expires_at = otp.lock_until;
      await otp.save();
      throw httpError(429, `Too many incorrect attempts. This email is locked for ${LOCK_MS / 60000} minutes.`, { retryAfter: LOCK_MS / 1000 });
    }

    await otp.save();
    const remaining = Math.max(0, MAX_ATTEMPTS - otp.attempts);
    throw httpError(400, `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`);
  }

  otp.consumed = true;
  await otp.save();
  return { purpose: otp.purpose };
}

module.exports = { requestOtp, verifyOtp, EXPIRY_MS, COOLDOWN_MS };
