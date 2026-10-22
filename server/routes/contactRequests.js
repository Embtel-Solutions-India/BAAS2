const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { sendMail } = require('../config/email');
const { FORM_RECIPIENT, EMAIL_RE, PHONE_RE, esc, clean, row } = require('../utils/formUtils');

// Public contact form (Contact page + service pages). Emails the enquiry to the firm.
const SOURCES = ['Contact page', 'Bookkeeping page'];

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
    first_name: clean(b.first_name, 80),
    last_name: clean(b.last_name, 80),
    email: clean(b.email, 160),
    phone: clean(b.phone, 30),
    message: clean(b.message, 3000, true),
    source: SOURCES.includes(b.source) ? b.source : 'Website',
  };

  const bad =
    d.first_name.length < 2 || d.last_name.length < 2 ||
    !EMAIL_RE.test(d.email) || !PHONE_RE.test(d.phone) ||
    d.message.length < 10 ||
    b.consent !== true;
  if (bad) return res.status(400).json({ error: 'Please check the form and try again.' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#a4001a;margin:0 0 4px">New website enquiry</h2>
      <p style="color:#666;margin:0 0 16px">From the ${esc(d.source)}. Reply to this email to respond to the client.</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee">
        ${row('Name', esc(`${d.first_name} ${d.last_name}`))}
        ${row('Email', `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}
        ${row('Phone', `<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>`)}
        ${row('Message', esc(d.message).replace(/\n/g, '<br>'))}
        ${row('SMS/email consent', 'Yes')}
      </table>
    </div>`;

  try {
    await sendMail({
      to: FORM_RECIPIENT,
      replyTo: d.email,
      subject: `New inquiry from ${d.first_name} ${d.last_name} (${d.source})`,
      html,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[contact-request] email failed:', err.message);
    res.status(502).json({ error: 'We could not send your message. Please call (510) 962-7300.' });
  }
});

module.exports = router;
