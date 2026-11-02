import { API_BASE } from './api';

// Consultation booking client. Every call goes to OUR server (/api/booking/...), which relays to the booking system;
// the browser never sees those links and no keys live here. Replies keep the shape of the booking API guide:
// { success, message, ... } and, after booking / cancel / reschedule, the fresh list of free times in `days`.
async function call(path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(`${API_BASE}/booking${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return { success: false, httpStatus: res.status, message: 'Something went wrong. Please try again or call (510) 962-7300.' };
    // `status` in a confirmation reply is the booking's own status (booked, cancelled, ...), so the HTTP code goes in `httpStatus`.
    return { ...data, httpStatus: res.status, success: data.success === true };
  } catch {
    return { success: false, httpStatus: 0, network: true, message: 'We could not reach the booking service. Check your connection and try again.' };
  }
}

export const getAvailability = () => call('/availability');
export const bookConsultation = (payload) => call('/', { method: 'POST', body: payload });
export const getConfirmation = (bookingId) => call(`/confirmation/${encodeURIComponent(bookingId)}`);
export const cancelConsultation = (bookingId, email) => call('/cancel', { method: 'POST', body: { booking_id: bookingId, email } });
export const rescheduleConsultation = (bookingId, email, startTime) => call('/reschedule', { method: 'POST', body: { booking_id: bookingId, email, start_time: startTime } });

// ---- reading the slot strings ----
// Slots look like "2026-11-03T10:00:00-08:00": already Pacific time, and they must be sent back exactly as received.
// So the date and clock time are read straight from the text, never converted through the browser's time zone.
export const slotDate = (iso) => iso.slice(0, 10);
export const slotTime = (iso) => iso.slice(11, 16);
export function addMinutesToTime(hhmm, minutes) {
  const total = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// days -> Map(date -> future slot strings). Times that have already passed are hidden.
export function futureSlotsByDate(days, now = Date.now()) {
  const map = new Map();
  (days || []).forEach((d) => {
    const slots = (d.slots || []).filter((s) => Date.parse(s) > now);
    if (slots.length) map.set(d.date, slots);
  });
  return map;
}

export const SESSION_MINUTES = 30;
