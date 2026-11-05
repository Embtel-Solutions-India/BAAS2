import { api } from './api';

// Service-page quote / consultation forms (Tax, Payroll, Accounting Cleanup, Consulting).
// Posts to the server, which emails the request to the firm.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;

// Optional text-message consent: exact wording the visitor sees; it is saved with the request.
export const SMS_CONSENT_LABEL = 'I agree to receive SMS updates and promotions from Bay Area Accounting Solutions at the mobile number I provided. Recurring texts may include service alerts and marketing messages. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help. Consent is not a condition of purchase.';
// Confirmation text sent after opt-in; shown on the /apply form so reviewers see exactly what subscribers receive.
export const SMS_OPT_IN_MESSAGE = 'You are subscribed to Bay Area Accounting Solutions SMS updates and promotions. Recurring texts may include service alerts and marketing messages. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help.';
export const SMS_CONSENT_TEXT =`${SMS_CONSENT_LABEL} See our Privacy Policy and SMS Terms.`;
export const smsFields = (on) => ({ sms_consent: !!on, sms_consent_text: on ? SMS_CONSENT_TEXT : '' });

export async function sendQuote(payload) {
  const { source } = payload;
  await api.post('/quote-requests', payload);
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
