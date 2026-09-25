/**
 * Regenerates react-app/public/sitemap.xml: the 16 static marketing pages
 * plus one <url> per published blog post (currently 0 — sitemap.xml has
 * never included articles, since it's a hand-written static file).
 *
 * Run manually after publishing/unpublishing blog posts, or wire into the
 * deploy step before `npm run build` in react-app/. Requires MONGODB_URI
 * (reads it from server/.env like the rest of the app).
 *
 * Usage: node scripts/generateSitemap.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');

const SITE_URL = 'https://bayareaaccountingsolutions.com';
const OUT_FILE = path.join(__dirname, '..', '..', 'react-app', 'public', 'sitemap.xml');

const STATIC_PAGES = [
  { loc: '/',                              priority: '1.0' },
  { loc: '/about',                         priority: '0.8' },
  { loc: '/services',                      priority: '0.9' },
  { loc: '/services/bookkeeping',          priority: '0.8' },
  { loc: '/services/tax-services',         priority: '0.8' },
  { loc: '/services/payroll',              priority: '0.8' },
  { loc: '/services/accounting',           priority: '0.8' },
  { loc: '/services/consulting',           priority: '0.8' },
  { loc: '/services/registered-agent',     priority: '0.8' },
  { loc: '/services/bookkeeping-cleanup',  priority: '0.8' },
  { loc: '/industries',                    priority: '0.7' },
  { loc: '/resources',                     priority: '0.6' },
  { loc: '/blog',                          priority: '0.7' },
  { loc: '/contact',                       priority: '0.7' },
  { loc: '/privacy-policy',                priority: '0.3' },
  { loc: '/terms-and-conditions',          priority: '0.3' },
];

function urlEntry(loc, priority, lastmod) {
  const lines = [`  <url>`, `    <loc>${SITE_URL}${loc}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  lines.push(`    <priority>${priority}</priority>`, `  </url>`);
  return lines.join('\n');
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baas_portal');

  const posts = await Blog.find({ status: 'published' })
    .select('slug publishedAt updated_at')
    .lean();

  console.log(`[sitemap] ${posts.length} published blog post(s) found.`);

  const entries = [
    ...STATIC_PAGES.map((p) => urlEntry(p.loc, p.priority)),
    ...posts.map((p) =>
      urlEntry(`/blog/${p.slug}`, '0.6', new Date(p.updated_at || p.publishedAt).toISOString().slice(0, 10))
    ),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(OUT_FILE, xml, 'utf8');
  console.log(`[sitemap] wrote ${STATIC_PAGES.length + posts.length} URLs → ${OUT_FILE}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[sitemap] failed:', err);
  process.exit(1);
});
