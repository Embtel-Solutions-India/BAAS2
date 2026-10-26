// Clean-up applied to blog article HTML and titles when they are served (the API for the page and the
// server-rendered copy for crawlers), so older posts written in the editor meet the same standard:
// canonical https links, tap-to-call phone numbers, real headings, no stray hashtag lines.

const SITE = 'https://bayareaaccountingsolutions.com';
const BRAND = ' | Bay Area Accounting Solutions';
const BRAND_SHORT = ' | BAAS';
const MAX_TITLE = 60;

// "Title." -> "Title"
const cleanTitle = (t) => String(t || '').trim().replace(/[.\s]+$/, '');

// Page <title>: full brand if it fits in ~60 characters, else the short brand, else the title alone.
function seoTitle(title) {
  const t = String(title || '').trim();
  if (t.length + BRAND.length <= MAX_TITLE) return t + BRAND;
  if (t.length + BRAND_SHORT.length <= MAX_TITLE) return t + BRAND_SHORT;
  return t;
}

const PHONE_RE = /\(?\b510\)?[\s.-]*962[\s.-]*7300\b/g;

function tidyBlogHtml(html) {
  if (!html) return html;
  let out = String(html);

  // Non-canonical links (http / www) -> https non-www; avoids a redirect hop.
  out = out.replace(/https?:\/\/(?:www\.)?bayareaaccountingsolutions\.com/gi, SITE);

  // Consultation / contact calls to action that point at the homepage go to the booking page.
  out = out.replace(/<a\b([^>]*?)href=("|')(?:https:\/\/bayareaaccountingsolutions\.com)?\/?\2([^>]*)>([\s\S]*?)<\/a>/gi, (m, pre, q, post, text) =>
    /consult|schedule|book|contact|call us|get started/i.test(text.replace(/<[^>]+>/g, '')) ? `<a ${pre.trim()} href="/book" ${post.trim()}>${text}</a>`.replace(/\s+>/, '>').replace(/\s{2,}/g, ' ') : m);

  // Plain-text phone numbers become tel: links (skipping text that is already inside a link).
  let inAnchor = 0;
  out = out.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      if (/^<a\b/i.test(part)) inAnchor += 1;
      else if (/^<\/a>/i.test(part)) inAnchor = Math.max(0, inAnchor - 1);
      return part;
    }
    return inAnchor ? part : part.replace(PHONE_RE, (n) => `<a href="tel:+15109627300">${n}</a>`);
  }).join('');

  // Paragraphs that are only a bold short line are section titles: make them real headings.
  out = out.replace(/<p>\s*<(strong|b)>\s*([^<]{3,100}?)\s*<\/\1>\s*<\/p>/gi, (m, tag, text) => {
    const t = text.trim();
    if (/[.!?]$/.test(t) || t.split(/\s+/).length > 14) return m;
    return `<h2>${t.replace(/:$/, '')}</h2>`;
  });

  // Trailing "#hashtag #hashtag" lines are not linked tags: drop them.
  out = out.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>|#[\w-]+)*<\/p>/gi, (m) => (/#[\w-]/.test(m) ? '' : m));

  return out;
}

module.exports = { tidyBlogHtml, cleanTitle, seoTitle };
