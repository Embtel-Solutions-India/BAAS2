// Marketing attribution for the website forms (spec section 3): utm_source, utm_medium, utm_campaign, gclid, referrer.
// Captured once when a visitor lands on ANY page, kept in browser storage while they browse, and sent with the form.
// A new tagged link replaces everything stored. Always returns all five keys ("" when unknown).
const STORE_KEY = 'baas_tracking';
const TAG_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'];
const KEYS = [...TAG_KEYS, 'referrer'];
const MAX_LEN = 200;

const blank = () => Object.fromEntries(KEYS.map((k) => [k, '']));
const clean = (v) => String(v || '').trim().slice(0, MAX_LEN);

// The page that sent the visitor. Empty when they came from this site itself or arrived directly.
function externalReferrer() {
  try {
    if (!document.referrer) return '';
    const ref = new URL(document.referrer);
    const same = (h) => h.replace(/^www\./, '').toLowerCase();
    return same(ref.hostname) === same(window.location.hostname) ? '' : clean(document.referrer);
  } catch {
    return '';
  }
}

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return Object.fromEntries(KEYS.map((k) => [k, clean(saved && saved[k])]));
  } catch {
    return blank();
  }
}

function write(values) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(values)); } catch { /* storage blocked: values just won't persist */ }
}

// Call once when the app starts (a full page load is a landing).
export function initTracking() {
  try {
    const q = new URLSearchParams(window.location.search);
    const referrer = externalReferrer();
    if (TAG_KEYS.some((k) => q.get(k))) {
      // Tagged link: replace whatever was stored.
      write({ ...Object.fromEntries(TAG_KEYS.map((k) => [k, clean(q.get(k))])), referrer });
    } else if (referrer) {
      // Untagged visit from another site: remember it only if we have nothing better stored.
      const saved = read();
      if (KEYS.every((k) => !saved[k])) write({ ...saved, referrer });
    }
  } catch { /* tracking must never break the page */ }
}

export function getTracking() {
  return read();
}
