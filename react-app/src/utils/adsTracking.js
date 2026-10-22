// Google Ads conversion: a click on any booking link (the HighLevel booking widget).
// Create a second conversion action in Google Ads, then set VITE_GADS_BOOKING_LABEL to the
// part after the slash in its send_to value (AW-18506219893/<label>). Disabled while unset.
const BOOKING_HOST = 'api.leadconnectorhq.com/widget/booking';
const LABEL = import.meta.env.VITE_GADS_BOOKING_LABEL;

export function initBookingTracking() {
  if (!LABEL) return;
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    const isBooking = a && (a.href.includes(BOOKING_HOST) || /^\/book([?#]|$)/.test(a.getAttribute('href') || ''));
    if (!isBooking || typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', { send_to: `AW-18506219893/${LABEL}` });
  });
}
