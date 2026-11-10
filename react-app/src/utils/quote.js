import { api } from './api';

// Service-page quote / consultation forms (Tax, Payroll, Accounting Cleanup, Consulting).
// Posts to the server, which emails the request to the firm.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;

// Two separate, optional, unticked text-message opt-ins (carriers require service and marketing consent to be collected
// separately). The exact wording the visitor sees is saved with the request.
const SMS_TAIL = 'Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help. Consent is not a condition of purchase.';
export const SMS_CARE_LABEL = `I agree to receive service text messages from Bay Area Accounting Solutions (BAAS) at the mobile number I provided, such as service alerts, appointment reminders, document requests and replies to my inquiry. ${SMS_TAIL}`;
export const SMS_PROMO_LABEL = `I agree to receive promotional text messages from Bay Area Accounting Solutions (BAAS) at the mobile number I provided, such as SMS updates, offers and promotions. Recurring marketing texts. ${SMS_TAIL}`;
// Confirmation text sent after the promotional opt-in.
export const SMS_OPT_IN_MESSAGE = 'You are subscribed to Bay Area Accounting Solutions SMS updates and promotions. Recurring texts may include service alerts and marketing messages. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help.';
export const SMS_NONE = { care: false, promo: false };
// `v` = { care, promo }. sms_consent is true when either box is ticked; the two kinds are also reported separately.
export const smsFields = (v) => {
  const care = !!(v && v.care);
  const promo = !!(v && v.promo);
  return {
    sms_consent: care || promo,
    sms_service_consent: care,
    sms_marketing_consent: promo,
    sms_consent_text: [care && SMS_CARE_LABEL, promo && SMS_PROMO_LABEL].filter(Boolean).join(' | '),
  };
};

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
