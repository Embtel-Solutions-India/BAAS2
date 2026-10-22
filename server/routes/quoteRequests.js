const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { sendMail } = require('../config/email');
const { FORM_RECIPIENT, EMAIL_RE, PHONE_RE, esc, clean, row } = require('../utils/formUtils');

// Quote / consultation request forms on the service pages (Tax, Payroll, Accounting Cleanup, Consulting).
// Each form sends its own labelled fields; they are emailed to the firm as a table (audit C1/C2: these
// forms previously showed a success message but sent nothing).
const SOURCES = ['Tax Services page', 'Payroll page', 'Accounting Cleanup page', 'Consulting page', 'Contractors page'];
// The contractors form has no required consent box: sending the request is itself the ask to be contacted,
// and text-message consent is a separate, optional checkbox whose exact wording is saved with the request.
const SMS_OPTIONAL = new Set(['Contractors page']);
const MAX_FIELDS = 15;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please call (510) 962-7300.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', limiter, async (req, res) => {
  const b = req.body || {};

  // Honeypot: real users never fill this hidden field. Pretend success so bots move on.
  if (b.website) return res.json({ ok: true });

  const d = {
    name: clean(b.name, 80),
    email: clean(b.email, 160),
    phone: clean(String(b.phone || ''), 30),
    source: SOURCES.includes(b.source) ? b.source : '',
  };
  const smsConsent = SMS_OPTIONAL.has(d.source) && b.sms_consent === true;
  const smsText = smsConsent ? clean(b.sms_consent_text, 1500, true) : '';

  // Labelled extras: { "Business Name": "Acme LLC", "Services": ["A", "B"] } -> [label, value] rows
  const extras = [];
  if (b.fields && typeof b.fields === 'object' && !Array.isArray(b.fields)) {
    for (const [k, v] of Object.entries(b.fields).slice(0, MAX_FIELDS)) {
      const label = clean(k, 40);
      const value = Array.isArray(v) ? v.map((x) => clean(String(x), 100)).filter(Boolean).join(', ') : clean(typeof v === 'string' ? v : '', 1500, true);
      if (label && value) extras.push([label, value]);
    }
  }

  const bad =
    !d.source ||
    d.name.length < 2 ||
    !EMAIL_RE.test(d.email) ||
    (d.phone && !PHONE_RE.test(d.phone)) ||
    (!SMS_OPTIONAL.has(d.source) && b.consent !== true);
  if (bad) return res.status(400).json({ error: 'Please check the form and try again.' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px">
      <h2 style="color:#a4001a;margin:0 0 4px">New request — ${esc(d.source)}</h2>
      <p style="color:#666;margin:0 0 16px">Reply to this email to respond to the client.</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee">
        ${row('Name', esc(d.name))}
        ${row('Email', `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}
        ${d.phone ? row('Phone', `<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>`) : ''}
        ${extras.map(([k, v]) => row(esc(k), esc(v).replace(/\n/g, '<br>'))).join('')}
        ${SMS_OPTIONAL.has(d.source)
          ? row('Text-message consent', smsConsent ? `<strong>Yes</strong><br><span style="color:#666;font-size:12px">${esc(smsText).replace(/\n/g, '<br>')}</span>` : 'No (not ticked)')
          : row('SMS/email consent', 'Yes')}
      </table>
    </div>`;

  try {
    await sendMail({ to: FORM_RECIPIENT, replyTo: d.email, subject: `New request from ${d.name} (${d.source})`, html });
    res.json({ ok: true });
  } catch (err) {
    console.error('[quote-request] email failed:', err.message);
    res.status(502).json({ error: 'We could not send your request. Please call (510) 962-7300.' });
  }
});

module.exports = router;
