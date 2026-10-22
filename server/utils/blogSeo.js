// Server-side SEO rendering for blog pages (audit A1-A3, B1-B4).
//
// Blog articles are data-driven (MongoDB), so they are not prerendered at build time. nginx proxies
// /blog/<slug> and /blog/page/<n> here, and these helpers turn the neutral SPA shell into a page
// crawlers can read without running JavaScript: unique <title>/description/canonical, Open Graph
// and Twitter tags, BlogPosting + BreadcrumbList JSON-LD, and the real article / listing HTML
// inside #root. React still mounts normally on top (createRoot replaces #root's children).
//
// Everything here is pure (no database access) so it can be unit tested.
const sanitizeHtml = require('sanitize-html');

const SITE = 'https://bayareaaccountingsolutions.com';
const SUFFIX = ' | Bay Area Accounting Solutions';
const DEFAULT_IMAGE = `${SITE}/og-default.png`;
const BLOG_DESCRIPTION = 'Practical bookkeeping, tax, and business finance advice for Bay Area entrepreneurs — written in plain English, not accountant-speak.';
const PAGE_SIZE = 9; // keep in sync with react-app/src/pages/Blog (limit: 9)

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// JSON for a <script type="application/ld+json"> block: "<" is escaped so content can never close the tag.
const ldScript = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const absolute = (u) => (!u ? DEFAULT_IMAGE : /^https?:\/\//i.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' }) : '');
const iso = (d) => (d ? new Date(d).toISOString() : undefined);
const plain = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// ---- <head> / <body> rewriting ------------------------------------------------------------------
function applyShell(shell, { title, description, canonical, robots = 'index, follow', image, ogType = 'website', extraHead = '', body = '' }) {
  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  html = html.replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${robots}" />`);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(canonical)}" />`);
  const social = [
    ['property', 'og:title', title], ['property', 'og:description', description], ['property', 'og:image', image || DEFAULT_IMAGE],
    ['property', 'og:url', canonical], ['property', 'og:type', ogType], ['property', 'og:site_name', 'Bay Area Accounting Solutions'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', title], ['name', 'twitter:description', description],
    ['name', 'twitter:image', image || DEFAULT_IMAGE],
  ].map(([attr, key, val]) => `    <meta ${attr}="${key}" content="${esc(val)}" />`).join('\n');
  html = html.replace('</head>', `${social}\n${extraHead}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

// ---- Single article -------------------------------------------------------------------------------
function renderPostPage(shell, blog, related = [], sanitizeOpts) {
  const url = `${SITE}/blog/${blog.slug}`;
  const title = `${blog.metaTitle || blog.title}${SUFFIX}`;
  const description = blog.metaDescription || blog.shortDescription || clip(plain(blog.content), 160);
  const image = absolute(blog.thumbnail);
  const published = blog.publishedAt || blog.created_at;
  const modified = blog.updated_at || published;
  const content = sanitizeHtml(blog.content || '', sanitizeOpts); // content is also sanitized when saved; defence in depth

  const schema = [
    {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: clip(blog.title, 110), description, url, image: [image],
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: iso(published), dateModified: iso(modified),
      author: { '@type': 'Person', name: blog.author || 'BAAS Team' },
      publisher: { '@type': 'Organization', name: 'Bay Area Accounting Solutions', logo: { '@type': 'ImageObject', url: `${SITE}/logo-512.png` } },
      articleSection: blog.category, keywords: (blog.tags || []).join(', ') || undefined,
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: blog.title, item: url },
      ],
    },
  ];

  const relatedHtml = related.length
    ? `<aside aria-label="Related articles"><h2>Related insights</h2><ul>${related.map((r) => `<li><a href="/blog/${esc(r.slug)}">${esc(r.title)}</a>${r.shortDescription ? ` — ${esc(r.shortDescription)}` : ''}</li>`).join('')}</ul></aside>`
    : '';
  const body = `<main id="app"><article>
<nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog">Blog</a> › <span>${esc(blog.title)}</span></nav>
<header><p>${esc(blog.category)}</p><h1>${esc(blog.title)}</h1>
<p>By ${esc(blog.author || 'BAAS Team')} · <time datetime="${esc(iso(published))}">${esc(fmtDate(published))}</time>${blog.readingTime ? ` · ${esc(blog.readingTime)}` : ''}</p></header>
${blog.thumbnail ? `<img src="${esc(image)}" alt="${esc(blog.title)}" />` : ''}
<div class="blog-rich-content">${content}</div>
${(blog.tags || []).length ? `<p>${(blog.tags || []).map((t) => `#${esc(t)}`).join(' ')}</p>` : ''}
</article>
${relatedHtml}
<nav aria-label="How we can help"><h2>How we can help</h2><ul>
<li><a href="/services/bookkeeping">Bookkeeping &amp; Accounting</a></li>
<li><a href="/services/tax-services">Business &amp; Individual Taxes</a></li>
<li><a href="/services/payroll">Payroll Management</a></li>
<li><a href="/services/consulting">Business Formation &amp; Consulting</a></li>
</ul><p><a href="/blog">More articles</a> · <a href="/contact">Contact us</a></p></nav></main>`;

  return applyShell(shell, {
    title, description, canonical: url, image, ogType: 'article',
    extraHead: [
      `    <meta property="article:published_time" content="${esc(iso(published))}" />`,
      modified ? `    <meta property="article:modified_time" content="${esc(iso(modified))}" />` : '',
      blog.author ? `    <meta property="article:author" content="${esc(blog.author)}" />` : '',
      `    ${schema.map(ldScript).join('\n    ')}`,
    ].filter(Boolean).join('\n'),
    body,
  });
}

// ---- Blog listing pages (/blog/page/<n>) --------------------------------------------------------
// `pageNum` >= 2 (page 1 is the prerendered /blog). `blogs` are the posts on that page.
function renderListingPage(shell, { pageNum, pages, blogs }) {
  const url = `${SITE}/blog/page/${pageNum}`;
  const title = `Blog – Page ${pageNum}${SUFFIX}`;
  const description = `${BLOG_DESCRIPTION} Page ${pageNum} of ${pages}.`;
  const pageUrl = (n) => (n === 1 ? '/blog' : `/blog/page/${n}`);
  const links = Array.from({ length: pages }, (_, i) => i + 1)
    .map((n) => (n === pageNum ? `<span aria-current="page">${n}</span>` : `<a href="${pageUrl(n)}">${n}</a>`)).join(' ');
  const body = `<main id="app">
<nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog">Blog</a> › <span>Page ${pageNum}</span></nav>
<h1>Financial Insights for Bay Area Business Owners</h1>
<p>${esc(BLOG_DESCRIPTION)}</p>
<ul>${blogs.map((b) => `<li><h2><a href="/blog/${esc(b.slug)}">${esc(b.title)}</a></h2><p>${esc(b.shortDescription || '')}</p></li>`).join('')}</ul>
<nav aria-label="Blog pagination">${links}</nav></main>`;
  const prevNext = [
    pageNum > 1 ? `    <link rel="prev" href="${SITE}${pageUrl(pageNum - 1)}" />` : '',
    pageNum < pages ? `    <link rel="next" href="${SITE}${pageUrl(pageNum + 1)}" />` : '',
    `    ${ldScript({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: `Page ${pageNum}`, item: url },
      ],
    })}`,
  ].filter(Boolean).join('\n');
  return applyShell(shell, { title, description, canonical: url, extraHead: prevNext, body });
}

// Not-found variants keep the neutral shell but make sure nothing indexes it.
function renderNotFound(shell, canonical) {
  return applyShell(shell, {
    title: `Page Not Found${SUFFIX}`, description: 'The page you are looking for does not exist or has been removed.',
    canonical, robots: 'noindex, follow',
  });
}

module.exports = { SITE, PAGE_SIZE, DEFAULT_IMAGE, renderPostPage, renderListingPage, renderNotFound };
