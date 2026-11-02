/**
 * Booking emails (customer confirmation, admin alert, cancellation / reschedule notices).
 * Sending never throws into the booking flow: a failed email is recorded on the booking and the booking stays.
 * Each kind is sent at most once per event, and transient failures are retried a couple of times.
 */
const { DateTime } = require('luxon');
const Booking = require('../models/Booking');
const { sendMail } = require('../config/email');
const { FORM_RECIPIENT, esc } = require('../utils/formUtils');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://bayareaaccountingsolutions.com').replace(/\/$/, '');
const PHONE = '(510) 962-7300';
const ADDRESS = '39159 Paseo Padre Parkway, Suite 115, Fremont, CA 94538';

const adminEmail = (settings) => settings.adminNotificationEmail || process.env.BOOKING_ADMIN_EMAIL || FORM_RECIPIENT;

function whenText(b) {
  const day = DateTime.fromISO(b.localDate, { zone: b.timezone }).toFormat('cccc, LLLL d, yyyy');
  const t = (hhmm) => DateTime.fromISO(`${b.localDate}T${hhmm}`, { zone: b.timezone }).toFormat('h:mm a');
  const abbr = DateTime.fromJSDate(new Date(b.startAtUtc), { zone: b.timezone }).toFormat('ZZZZ'); // PST / PDT
  return { day, time: `${t(b.localStartTime)} – ${t(b.localEndTime)}`, zone: `${abbr} (${b.timezone})` };
}

const manageUrl = (b, token) => `${SITE_URL}/book/manage/${encodeURIComponent(b.reference)}?token=${encodeURIComponent(token)}`;

const cell = (label, value) => `<tr><td style="padding:8px 12px;color:#666;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:8px 12px;color:#111">${value}</td></tr>`;
const shell = (title, intro, rows, footer = '') => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 8px">${esc(title)}</h2>
    <p style="margin:0 0 16px;color:#444">${intro}</p>
    <table style="border-collapse:collapse;width:100%;background:#f7f5f5;border-radius:8px">${rows}</table>
    ${footer}
    <p style="margin:24px 0 0;color:#666;font-size:13px">Bay Area Accounting Solutions · ${esc(ADDRESS)} · ${PHONE}</p>
  </div>`;

function details(b) {
  const w = whenText(b);
  return [
    cell('Reference', `<strong>${esc(b.reference)}</strong>`),
    cell('Date', esc(w.day)),
    cell('Time', `${esc(w.time)} ${esc(w.zone)}`),
    cell('Type', esc(b.appointmentTypeLabel || b.appointmentType)),
    cell('Topic', esc(b.purpose)),
  ].join('');
}

const templates = {
  confirmation: (b, token) => ({
    subject: `Your appointment is confirmed: ${whenText(b).day}`,
    html: shell(
      'Your appointment is confirmed',
      `Hi ${esc(b.customerName)}, thank you for booking with us. Here are your details.`,
      details(b),
      `<p style="margin:16px 0 0;color:#444">Need to change plans? <a href="${esc(manageUrl(b, token))}" style="color:#c8102e">Cancel or reschedule your appointment</a>, or call us at ${PHONE}.</p>`,
    ),
  }),
  admin: (b) => ({
    subject: `New booking: ${b.customerName} on ${b.localDate} at ${b.localStartTime}`,
    html: shell(
      'New appointment booked',
      'A customer booked through the website.',
      details(b) + cell('Name', esc(b.customerName)) + cell('Email', `<a href="mailto:${esc(b.customerEmail)}">${esc(b.customerEmail)}</a>`) + cell('Phone', esc(b.customerPhone))
        + (b.companyName ? cell('Company', esc(b.companyName)) : '') + (b.customerNotes ? cell('Notes', esc(b.customerNotes).replace(/\n/g, '<br>')) : ''),
    ),
  }),
  cancelled: (b, _token, by) => ({
    subject: `Appointment cancelled: ${b.reference}`,
    html: shell('Your appointment was cancelled', `Hi ${esc(b.customerName)}, ${by === 'customer' ? 'your appointment has been cancelled as requested' : 'we had to cancel your appointment'}.`, details(b),
      `<p style="margin:16px 0 0;color:#444"><a href="${SITE_URL}/book" style="color:#c8102e">Book a new time</a> whenever you are ready.</p>`),
  }),
  rescheduled: (b, token, _by, previous) => ({
    subject: `Appointment rescheduled: ${whenText(b).day}`,
    html: shell('Your appointment was rescheduled', `Hi ${esc(b.customerName)}, your appointment is now at the time below${previous ? ` (it was ${esc(previous.date)} at ${esc(previous.startTime)})` : ''}.`, details(b),
      `<p style="margin:16px 0 0;color:#444">Use <a href="${esc(manageUrl(b, token))}" style="color:#c8102e">this link</a> to change it again. Earlier links no longer work.</p>`),
  }),
  adminChange: (b, _token, by, previous, kind) => ({
    subject: `Booking ${kind}: ${b.reference}`,
    html: shell(`Booking ${kind}`, `${esc(b.customerName)}'s appointment was ${kind} by ${esc(by)}${previous ? ` (previously ${esc(previous.date)} at ${esc(previous.startTime)})` : ''}.`, details(b)),
  }),
};

async function sendWithRetry(message, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try { await sendMail(message); return { ok: true, attempts: i }; } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise((r) => setTimeout(r, 400 * i));
    }
  }
  return { ok: false, attempts, error: String((lastErr && lastErr.message) || lastErr).slice(0, 300) };
}

// Send one email and record the outcome on the booking. Skips if that notification was already sent.
async function deliver(bookingId, field, message) {
  const guard = await Booking.findOneAndUpdate({ _id: bookingId, [`notifications.${field}.status`]: { $ne: 'sent' } }, { $set: { [`notifications.${field}.status`]: 'pending' } }, { returnDocument: 'after' });
  if (!guard) return { ok: true, skipped: true };
  const r = await sendWithRetry(message);
  await Booking.updateOne({ _id: bookingId }, { $set: {
    [`notifications.${field}.status`]: r.ok ? 'sent' : 'failed',
    [`notifications.${field}.sentAt`]: r.ok ? new Date() : null,
    [`notifications.${field}.attempts`]: r.attempts,
    [`notifications.${field}.error`]: r.ok ? '' : r.error,
  } });
  if (!r.ok) console.error(`[booking] ${field} email failed for ${bookingId}:`, r.error);
  return r;
}

const safe = (fn) => fn().catch((err) => { console.error('[booking] notification error:', err); return { ok: false }; });

const afterCreate = (booking, token, settings) => Promise.all([
  safe(() => deliver(booking._id, 'customerConfirmation', { to: booking.customerEmail, ...templates.confirmation(booking, token) })),
  safe(() => deliver(booking._id, 'adminNotification', { to: adminEmail(settings), replyTo: booking.customerEmail, ...templates.admin(booking) })),
]);

// Cancel / reschedule notices are sent every time (each is a new event), so they do not use the once-only guard.
async function afterChange(booking, { kind, token, by, previous, settings }) {
  const toCustomer = kind === 'cancelled'
    ? templates.cancelled(booking, token, by)
    : templates.rescheduled(booking, token, by, previous);
  const adminMsg = templates.adminChange(booking, token, by, previous, kind);
  const results = await Promise.all([
    safe(() => sendWithRetry({ to: booking.customerEmail, ...toCustomer })),
    safe(() => sendWithRetry({ to: adminEmail(settings), replyTo: booking.customerEmail, ...adminMsg })),
  ]);
  const failed = results.filter((r) => !r.ok);
  await Booking.updateOne({ _id: booking._id }, { $set: {
    'notifications.customerChange.status': failed.length ? 'failed' : 'sent',
    'notifications.customerChange.sentAt': failed.length ? null : new Date(),
    'notifications.customerChange.error': failed.length ? String(failed[0].error || 'send failed').slice(0, 300) : '',
  }, $inc: { 'notifications.customerChange.attempts': 1 } });
  return results;
}

module.exports = { afterCreate, afterChange, templates, whenText, manageUrl, adminEmail };
