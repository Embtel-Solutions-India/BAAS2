// Website forms -> n8n webhooks (spec: "Website Forms - Developer Requirements", Phase 1).
// One POST per submission, JSON, no authentication, no keys in the browser. HTTP 200 means success.
import { getTracking } from './tracking';
import { APPLICATION_SERVICES, PAYROLL_SERVICE } from '../data/applicationForm';

export const APPLICATION_WEBHOOK = 'https://n8n.embtelsolutions.ca/webhook/7d0c1f3e-1b2a-4c5d-9e8f-baas00000001';
export const CONTACT_WEBHOOK = 'https://n8n.embtelsolutions.ca/webhook/baas-contact-form';

const E164 = /^\+[1-9]\d{7,14}$/;

// "+15105550123" from what a visitor types: 10-digit US numbers get +1, anything else needs its own country code.
export function normalizePhone(raw) {
  const text = String(raw || '').trim();
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';
  if (text.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return '';
}

export const phoneIssue = (raw) => {
  if (!String(raw || '').trim()) return 'Phone number is required.';
  return E164.test(normalizePhone(raw)) ? '' : 'Enter a US number, or include the country code, e.g. +15105550123.';
};

export function buildContactPayload(f) {
  return {
    first_name: f.first_name.trim(),
    last_name: f.last_name.trim(),
    email: f.email.trim(),
    phone: normalizePhone(f.phone),
    message: (f.message || '').trim(),
    ...getTracking(),
  };
}

// `services` maps each ticked service to its chosen speed, e.g. { 'Payroll Management': 'emergency' }.
export function buildApplicationPayload(f) {
  const ticked = APPLICATION_SERVICES.filter((s) => f.services[s.value]);
  const service_speeds = Object.fromEntries(ticked.map((s) => [s.value, s.speeds.length === 1 ? s.speeds[0] : f.services[s.value]]));
  const needsEmployees = service_speeds[PAYROLL_SERVICE] === 'emergency';
  return {
    first_name: f.first_name.trim(),
    last_name: f.last_name.trim(),
    email: f.email.trim(),
    phone: normalizePhone(f.phone),
    client_type: f.client_type,
    state: f.state,
    services: ticked.map((s) => s.value),
    service_speeds,
    payroll_employees: needsEmployees ? Number(f.payroll_employees) : 0,
    ...getTracking(),
  };
}

export async function postForm(url, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Form service returned ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

export const SEND_FAILED = 'Sorry, we could not send your request. Please try again, or call us at (510) 962-7300.';
