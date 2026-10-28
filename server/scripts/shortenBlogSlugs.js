/**
 * Shortens blog slugs longer than 75 characters (audit B8) without losing search ranking:
 *   1. renames the slug in the database,
 *   2. rewrites /blog/<old-slug> links inside every post's content,
 *   3. adds a permanent (301) redirect old -> new to react-app/vercel.json.
 *
 * Dry run by default: prints the old -> new mapping and writes nothing.
 * Usage:  node scripts/shortenBlogSlugs.js            (preview)
 *         node scripts/shortenBlogSlugs.js --apply    (database + vercel.json)
 * After applying: deploy, then run `npm run generate:sitemap` and resubmit the sitemap in Search Console.
 * Requires MONGODB_URI (read from server/.env like the rest of the app).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');

const APPLY = process.argv.includes('--apply');
const MAX = 75;     // slugs longer than this are shortened
const TARGET = 60;  // new slugs are cut at a word boundary at or below this length
const VERCEL_JSON = path.join(__dirname, '..', '..', 'react-app', 'vercel.json');

function shorten(slug, taken) {
  const parts = slug.split('-');
  let out = '';
  for (const part of parts) {
    const next = out ? `${out}-${part}` : part;
    if (next.length > TARGET) break;
    out = next;
  }
  let candidate = out || slug.slice(0, TARGET);
  for (let i = 2; taken.has(candidate); i++) candidate = `${out}-${i}`;
  return candidate;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baas_portal');
  const posts = await Blog.find({}).select('slug content').lean();
  const taken = new Set(posts.map((p) => p.slug));

  const renames = [];
  for (const p of posts.filter((x) => x.slug.length > MAX)) {
    const next = shorten(p.slug, taken);
    taken.add(next);
    renames.push({ id: p._id, from: p.slug, to: next });
    console.log(`[slug] ${p.slug} (${p.slug.length})\n    -> ${next} (${next.length})`);
  }

  if (!renames.length) {
    console.log('[slug] no slug is longer than the limit; nothing to do.');
    await mongoose.disconnect();
    return;
  }
  if (!APPLY) {
    console.log(`[slug] ${renames.length} slug(s) would change (dry run, nothing written; re-run with --apply).`);
    await mongoose.disconnect();
    return;
  }

  for (const r of renames) await Blog.updateOne({ _id: r.id }, { $set: { slug: r.to, updated_at: new Date() } });

  // Internal links in other posts' content.
  for (const p of posts) {
    let content = p.content || '';
    for (const r of renames) content = content.split(`/blog/${r.from}`).join(`/blog/${r.to}`);
    if (content !== p.content) await Blog.updateOne({ _id: p._id }, { $set: { content } });
  }

  // 301s so the old URLs keep their ranking and any existing links keep working.
  const raw = fs.readFileSync(VERCEL_JSON, 'utf8');
  const lines = renames
    .filter((r) => !raw.includes(`"/blog/${r.from}"`))
    .map((r) => `    { "source": "/blog/${r.from}", "destination": "/blog/${r.to}", "permanent": true },`);
  const updated = raw.replace(/("redirects":\s*\[\r?\n)/, `$1${lines.join('\n')}\n`);
  JSON.parse(updated); // never write a broken vercel.json
  fs.writeFileSync(VERCEL_JSON, updated, 'utf8');

  console.log(`[slug] renamed ${renames.length} post(s) and added ${lines.length} redirect(s) to vercel.json.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[slug] failed:', err);
  process.exit(1);
});
