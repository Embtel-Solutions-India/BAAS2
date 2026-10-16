const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { sendMail } = require('../config/email');

// Public "Request Rush Service" form (website popup). Emails the request to the firm.
const TO = () => process.env.RUSH_REQUEST_TO || 'info@bayareaaccountingsolutions.com';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const SERVICES = [
  'Bookkeeping & Accounting', 'Business & Individual Taxes', 'Payroll Management',
  'Business Formation', 'Registered Agent', 'Accounting Cleanup', 'Other',
];

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please call (510) 962-7300 if this is urgent.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Single-line fields get CR/LF stripped (they end up in the email subject).
const clean = (v, max, multiline = false) =>
  (typeof v === 'string' ? (multiline ? v : v.replace(/[\r\n]+/g, ' ')).trim().slice(0, max) : '');

router.post('/', limiter, async (req, res) => {
  const b = req.body || {};

  // Honeypot: real users never fill this hidden field. Pretend success so bots move on.
  if (b.website) return res.json({ ok: true });

  const d = {
    first_name: clean(b.first_name, 80),
    last_name: clean(b.last_name, 80),
    email: clean(b.email, 160),
    phone: clean(b.phone, 30),
    service: clean(b.service, 80),
    deadline: clean(b.deadline, 10),
    message: clean(b.message, 3000, true),
  };

  const today = new Date().toISOString().slice(0, 10);
  const bad =
    d.first_name.length < 2 || d.last_name.length < 2 ||
    !EMAIL_RE.test(d.email) || !PHONE_RE.test(d.phone) ||
    !SERVICES.includes(d.service) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(d.deadline) || d.deadline < new Date(Date.now() - 864e5).toISOString().slice(0, 10) ||
    d.message.length < 10 ||
    b.consent !== true;
  if (bad) return res.status(400).json({ error: 'Please check the form and try again.' });

  const row = (label, value) =>
    `<tr><td style="padding:8px 12px;color:#666;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:8px 12px;color:#111">${value}</td></tr>`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#a4001a;margin:0 0 4px">Rush Service Request</h2>
      <p style="color:#666;margin:0 0 16px">Submitted from the website on ${esc(today)}. Reply to this email to respond to the client.</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee">
        ${row('Name', esc(`${d.first_name} ${d.last_name}`))}
        ${row('Email', `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}
        ${row('Phone', `<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>`)}
        ${row('Service', esc(d.service))}
        ${row('Needed by', `<strong>${esc(d.deadline)}</strong>`)}
        ${row('Details', esc(d.message).replace(/\n/g, '<br>'))}
        ${row('SMS/email consent', 'Yes')}
      </table>
    </div>`;

  try {
    await sendMail({
      to: TO(),
      replyTo: d.email,
      subject: `RUSH request from ${d.first_name} ${d.last_name} (needed by ${d.deadline})`,
      html,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[rush-request] email failed:', err.message);
    res.status(502).json({ error: 'We could not send your request. Please call (510) 962-7300.' });
  }
});

module.exports = router;
