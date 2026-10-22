const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { sendMail } = require('../config/email');
const { FORM_RECIPIENT, EMAIL_RE, esc, clean, row } = require('../utils/formUtils');

// Public "Request Rush Service" form (/rush-service#request, spec section 9).
//  1. Emails the request to info@bayareaaccountingsolutions.com - this is the source of truth.
//  2. Sends the client the auto-reply (spec 9.3).
//  3. If GHL_RUSH_WEBHOOK_URL is set, also posts the request + tags to a GoHighLevel workflow webhook
//     (contact, tags, "Rush Requests" opportunity and the owner SMS alert are configured inside GHL).
const OFFICE = '39159 Paseo Padre Parkway, Suite 115, Fremont, CA 94538';
const PHONE = '(510) 962-7300';
const HOURS = 'Mon–Fri, 9 a.m.–5 p.m. PT';

// Keep these option lists in sync with react-app/src/data/rush.js
const SERVICES = [
  'Monthly bookkeeping close', 'Personal tax return', 'Business tax return', 'Cleanup and catch-up', 'Off-cycle payroll',
  'California business formation', 'Registered agent', 'Tax Deadline Rescue', 'Lender-Ready Financials',
  'Petition-Ready Financials', 'Launch Fast', 'Same-Day Payroll Fix', 'Not sure',
];
const TIERS = ['Priority', 'Express', 'Emergency', 'Not sure, help me choose'];
const REASONS = [
  'Tax filing', 'Loan or mortgage', 'Lease', 'Immigration petition or RFE', 'Payroll', 'Company formation',
  'Investor or due diligence', 'IRS or state notice', 'Other',
];
const DOCS = ['All ready', 'Some ready', 'Not yet'];
const STEPS = [
  ['Tell us your deadline', 'Fill in the short form or call us.'],
  ['Get a written answer', "We confirm what's feasible, the tier, fee and timeline within 4 business hours."],
  ['Approve and pay the rush fee', 'Then upload documents to the secure client portal.'],
  ['The clock starts', 'Your timeline begins once we have complete documents.'],
];

// ---- Pacific-Time business-day math -----------------------------------------------------------
const todayPT = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const toUTC = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUTC = (ms) => new Date(ms).toISOString().slice(0, 10);
const isWeekend = (iso) => { const g = new Date(toUTC(iso)).getUTCDay(); return g === 0 || g === 6; };
const nextBusinessDay = (iso) => { let ms = toUTC(iso); do { ms += 86400000; } while (isWeekend(fromUTC(ms))); return fromUTC(ms); };
const validDate = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && fromUTC(toUTC(iso)) === iso;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: `Too many requests. Please call ${PHONE} if this is urgent.` },
  standardHeaders: true,
  legacyHeaders: false,
});

// Best-effort POST to the GoHighLevel workflow webhook (never throws).
async function postToGhl(payload) {
  const url = process.env.GHL_RUSH_WEBHOOK_URL;
  if (!url) return 'skipped';
  if (typeof fetch !== 'function') throw new Error('fetch unavailable');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
    if (!res.ok) throw new Error(`GHL webhook HTTP ${res.status}`);
    return 'ok';
  } finally { clearTimeout(t); }
}

router.post('/', limiter, async (req, res) => {
  const b = req.body || {};

  // Honeypot: real users never fill this hidden field. Pretend success so bots move on.
  if (b.website) return res.json({ ok: true });

  const d = {
    full_name: clean(b.full_name, 80),
    business_name: clean(b.business_name, 120),
    email: clean(b.email, 160),
    phone: clean(String(b.phone || ''), 30).replace(/\D/g, ''),
    existing_client: clean(b.existing_client, 3),
    service: clean(b.service, 60),
    tier: clean(b.tier, 40),
    deadline: clean(b.deadline, 10),
    reason: clean(b.reason, 60),
    docs_ready: clean(b.docs_ready, 20),
    notes: clean(b.notes, 1000, true),
    page_url: clean(b.page_url, 500),
    utm_source: clean(b.utm_source, 100),
    utm_medium: clean(b.utm_medium, 100),
    utm_campaign: clean(b.utm_campaign, 100),
    button_clicked: clean(b.button_clicked, 100),
  };
  if (d.phone.length === 11 && d.phone[0] === '1') d.phone = d.phone.slice(1);

  const today = todayPT();
  const bad =
    d.full_name.length < 2 ||
    !EMAIL_RE.test(d.email) ||
    d.phone.length !== 10 ||
    !['Yes', 'No'].includes(d.existing_client) ||
    !SERVICES.includes(d.service) ||
    !TIERS.includes(d.tier) ||
    !validDate(d.deadline) || d.deadline < today ||
    !REASONS.includes(d.reason) ||
    !DOCS.includes(d.docs_ready) ||
    b.consent !== true;
  if (bad) return res.status(400).json({ error: 'Please check the form and try again.' });

  const daysToDeadline = Math.round((toUTC(d.deadline) - toUTC(today)) / 86400000);
  const urgent = d.deadline <= nextBusinessDay(today); // today or the next business day
  const firstName = d.full_name.split(/\s+/)[0];
  const phoneFmt = `(${d.phone.slice(0, 3)}) ${d.phone.slice(3, 6)}-${d.phone.slice(6)}`;
  const tags = ['rush-request', `rush-tier-${slug(d.tier)}`, `rush-service-${slug(d.service)}`];
  if (d.existing_client === 'Yes') tags.push('existing-client');
  if (urgent) tags.push('rush-urgent');

  // ---- Internal email (the firm) ----
  const internalHtml = `
    <div style="font-family:Arial,sans-serif;max-width:640px">
      <h2 style="color:#a4001a;margin:0 0 4px">${urgent ? 'URGENT — ' : ''}Rush Service Request</h2>
      <p style="color:#666;margin:0 0 16px">Reply to this email to respond to the client. Tags: ${esc(tags.join(', '))}</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee">
        ${row('Name', esc(d.full_name))}
        ${row('Business', esc(d.business_name || '—'))}
        ${row('Email', `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}
        ${row('Phone', `<a href="tel:+1${esc(d.phone)}">${esc(phoneFmt)}</a>`)}
        ${row('Current BAAS client', esc(d.existing_client))}
        ${row('Service needed', esc(d.service))}
        ${row('Rush tier', `<strong>${esc(d.tier)}</strong>`)}
        ${row('Deadline (PT)', `<strong>${esc(d.deadline)}</strong> (${daysToDeadline} day${daysToDeadline === 1 ? '' : 's'} away)`)}
        ${row('Deadline is for', esc(d.reason))}
        ${row('Documents ready', esc(d.docs_ready))}
        ${row('Notes', esc(d.notes || '—').replace(/\n/g, '<br>'))}
        ${row('Consent', 'Yes — phone, email or text')}
        ${row('Button clicked', esc(d.button_clicked || '—'))}
        ${row('Page', esc(d.page_url || '—'))}
        ${row('UTM', esc([d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(' / ') || '—'))}
        ${row('Submitted', esc(new Date().toISOString()))}
      </table>
    </div>`;

  // ---- Auto-reply (spec 9.3) ----
  const replyHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#222;line-height:1.6">
      <h2 style="color:#a4001a;margin:0 0 8px">We received your rush request</h2>
      <p>Thanks, ${esc(firstName)}. We'll reply within 4 business hours (${HOURS}) with what's possible, the fee and the timeline.</p>
      <h3 style="margin:20px 0 8px">Your request</h3>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee">
        ${row('Service', esc(d.service))}
        ${row('Rush tier', esc(d.tier))}
        ${row('Deadline (PT)', esc(d.deadline))}
        ${row('Deadline is for', esc(d.reason))}
        ${row('Documents ready', esc(d.docs_ready))}
      </table>
      <h3 style="margin:20px 0 8px">What happens next</h3>
      <ol style="padding-left:20px">${STEPS.map(([t, x]) => `<li><strong>${esc(t)}</strong> — ${esc(x)}</li>`).join('')}</ol>
      <p><strong>Please don't email tax documents. We'll send you a secure portal link.</strong></p>
      <p style="color:#666;font-size:13px">Bay Area Accounting Solutions<br>${esc(OFFICE)}<br>${PHONE}</p>
    </div>`;

  const ghlPayload = {
    source: 'rush-service-form', tags,
    contact: { full_name: d.full_name, company_name: d.business_name, email: d.email, phone: `+1${d.phone}` },
    rush_existing_client: d.existing_client, rush_service: d.service, rush_tier: d.tier, rush_deadline: d.deadline,
    rush_reason: d.reason, rush_docs_ready: d.docs_ready, rush_notes: d.notes, consent_rush: true, urgent,
    days_to_deadline: daysToDeadline, page_url: d.page_url, utm_source: d.utm_source, utm_medium: d.utm_medium,
    utm_campaign: d.utm_campaign, button_clicked: d.button_clicked, submitted_at: new Date().toISOString(),
  };

  const [internal, , ghl] = await Promise.allSettled([
    sendMail({
      to: FORM_RECIPIENT,
      replyTo: d.email,
      subject: `${urgent ? 'URGENT: ' : ''}RUSH (${d.tier}) request from ${d.full_name} — ${d.service} (needed by ${d.deadline})`,
      html: internalHtml,
    }),
    sendMail({ to: d.email, subject: `We received your rush request — ${d.service}`, html: replyHtml }),
    postToGhl(ghlPayload),
  ]);
  [['internal email', internal], ['GHL webhook', ghl]].forEach(([label, r]) => {
    if (r.status === 'rejected') console.error(`[rush-request] ${label} failed:`, r.reason && r.reason.message);
  });

  // Success if the firm got the request by email, or via GHL when that's configured and worked.
  const delivered = internal.status === 'fulfilled' || (ghl.status === 'fulfilled' && ghl.value === 'ok');
  if (!delivered) return res.status(502).json({ error: `We could not send your request. Please call ${PHONE}.` });
  res.json({ ok: true });
});

module.exports = router;
