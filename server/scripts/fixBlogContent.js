/**
 * One-off cleanup for blog-post content errors found in the 28 Oct 2026 audit
 * (A8 cut-off heading, B3 unlinked consultation CTAs, B4 http://www links,
 * B5 H1s that do not match the post topic, B7 category / brand-name / stray-period typos).
 *
 * Dry run by default: prints what would change and writes nothing.
 * Usage:  node scripts/fixBlogContent.js            (preview)
 *         node scripts/fixBlogContent.js --apply    (write to the database)
 * Requires MONGODB_URI (read from server/.env like the rest of the app).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Blog = require('../models/Blog');

const APPLY = process.argv.includes('--apply');
const BOOK = '/book';

// Wrap a plain-text CTA phrase in a link to /book. Text already inside an <a>...</a> is left alone.
const linkCta = (html, phrase) => {
  const re = new RegExp(phrase, 'gi');
  return html
    .split(/(<a\s[^>]*>[\s\S]*?<\/a>)/i)
    .map((part) => (/^<a\s/i.test(part) ? part : part.replace(re, (t) => `<a href="${BOOK}">${t}</a>`)))
    .join('');
};

const FIXES = [
  {
    // A8: heading cut off at "Your Next Est" with a stray quote mark
    match: (b) => b.slug.startsWith('upcoming-tax-deadlines'),
    apply: (b) => ({ content: b.content.replace(/September 15: Your Next Est["”]?/g, 'September 15: Your Next Estimated Tax Payment') }),
  },
  {
    // B3: consultation CTAs with no link, or pointing at /contact or the homepage
    match: (b) => /^(nonprofit-501|7-financial-mistakes|quickbooks-online-bookkeeping-payroll|trust-accounting)/.test(b.slug),
    apply: (b) => {
      let c = b.content;
      c = linkCta(c, 'BOOK A PRE-LAUNCH STRUCTURE CONSULTATION');
      c = linkCta(c, 'schedule a consultation');
      c = c.replace(/(<a\b[^>]*href=")(?:https?:\/\/(?:www\.)?bayareaaccountingsolutions\.com)?\/contact\/?("[^>]*>\s*Book a free consultation)/gi, `$1${BOOK}$2`);
      return { content: c };
    },
  },
  {
    // B4 (stored copy): http / www links in the closing contact block
    match: () => true,
    apply: (b) => ({ content: b.content.replace(/https?:\/\/www\.bayareaaccountingsolutions\.com/gi, 'https://bayareaaccountingsolutions.com').replace(/http:\/\/bayareaaccountingsolutions\.com/gi, 'https://bayareaaccountingsolutions.com') }),
  },
  {
    // B5: H1 says nothing about the construction-bookkeeping topic in the SEO title
    match: (b) => b.slug.startsWith('you-re-making-money'),
    apply: () => ({ title: 'Construction Bookkeeping: Do You Know Where Your Money Is Going?' }),
  },
  {
    // B5: H1 does not mention QuickBooks, which is what the post is about
    match: (b) => b.slug.startsWith('quickbooks-online-bookkeeping-payroll'),
    apply: () => ({ title: 'QuickBooks Online Bookkeeping & Payroll: Do You Know How Your Business Is Doing?' }),
  },
  {
    // B7: topic is DIY bookkeeping, not formation
    match: (b) => b.slug.startsWith('the-hidden-cost'),
    apply: () => ({ category: 'Bookkeeping' }),
  },
  {
    // B7: stray trailing period on the card title
    match: (b) => b.slug.startsWith('trust-accounting'),
    apply: (b) => ({ title: b.title.replace(/\.\s*$/, '') }),
  },
  {
    // B7: brand name is "Solutions"
    match: () => true,
    apply: (b) => ({ content: b.content.replace(/Bay Area Accounting Solution(?!s)/g, 'Bay Area Accounting Solutions') }),
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baas_portal');
  const posts = await Blog.find({}).lean();
  let changed = 0;

  for (const post of posts) {
    const next = { ...post };
    for (const fix of FIXES) {
      if (fix.match(next)) Object.assign(next, fix.apply(next));
    }
    const fields = ['title', 'category', 'content'].filter((k) => next[k] !== post[k]);
    if (!fields.length) continue;
    changed++;
    console.log(`[blog] ${post.slug}: would change ${fields.join(', ')}`);
    if (APPLY) {
      const $set = Object.fromEntries(fields.map((k) => [k, next[k]]));
      await Blog.updateOne({ _id: post._id }, { $set: { ...$set, updated_at: new Date() } });
    }
  }

  console.log(`[blog] ${changed} post(s) ${APPLY ? 'updated' : 'need changes (dry run, nothing written; re-run with --apply)'}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[blog] failed:', err);
  process.exit(1);
});
