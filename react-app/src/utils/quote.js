import { api } from './api';

// Service-page quote / consultation forms (Tax, Payroll, Accounting Cleanup, Consulting).
// Posts to the server, which emails the request to the firm.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;

export async function sendQuote({ source, name, email, phone, fields, consent, website }) {
  await api.post('/quote-requests', { source, name, email, phone, fields, consent, website });
  try {
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form: source });
  } catch { /* analytics must never break the form */ }
}

// '' when OK, otherwise the QUOTE_STATUS key describing the first problem.
export function contactIssue({ name, email, phone }) {
  if (!name || !email) return 'error';
  if (!EMAIL_RE.test(email)) return 'email';
  if (phone && !PHONE_RE.test(phone)) return 'phone';
  return '';
}

// Button labels for the form states.
export const QUOTE_STATUS = {
  error: 'Please fill all required fields',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  consent: 'Please tick the consent box above',
  sending: 'Sending...',
  failed: 'Could not send — please try again',
};

export const QUOTE_FAILED_NOTE = 'Something went wrong. Please try again, or call (510) 962-7300 or email info@bayareaaccountingsolutions.com.';
