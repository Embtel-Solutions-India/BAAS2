// Shared helpers for the public website forms (Rush Service, Contact).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Every website form (Contact, Bookkeeping page, Rush Service) is emailed to this address.
const FORM_RECIPIENT = 'info@bayareaaccountingsolutions.com';

const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Single-line fields get CR/LF stripped (they end up in the email subject).
const clean = (v, max, multiline = false) =>
  (typeof v === 'string' ? (multiline ? v : v.replace(/[\r\n]+/g, ' ')).trim().slice(0, max) : '');

const row = (label, value) =>
  `<tr><td style="padding:8px 12px;color:#666;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:8px 12px;color:#111">${value}</td></tr>`;

module.exports = { FORM_RECIPIENT, EMAIL_RE, PHONE_RE, esc, clean, row };
