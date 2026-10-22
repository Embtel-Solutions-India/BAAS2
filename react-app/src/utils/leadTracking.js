// Lead-intent events (audit F2). They are sent with gtag('event', ...), so they reach GA4 once a GA4 config
// is present on the page, and are a harmless no-op otherwise. Form submissions fire `generate_lead` from the
// forms themselves; this file covers link clicks.
const BOOKING_HOST = 'api.leadconnectorhq.com/widget/booking';

function send(name, params) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch { /* analytics must never break the page */ }
}

export function initLeadTracking() {
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const location = window.location.pathname;
    if (href.startsWith('tel:')) send('click_to_call', { location });
    else if (href.startsWith('mailto:')) send('email_click', { location });
    // The calendar itself runs inside the embedded HighLevel widget, so only the click / page view can be tracked from this site.
    else if (href.includes(BOOKING_HOST) || /^\/book([?#]|$)/.test(href)) send('book_appointment_click', { location });
  });
}
