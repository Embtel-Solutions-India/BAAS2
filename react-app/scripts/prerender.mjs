/**
 * Build-time prerender (SSG) for the public marketing pages.
 *
 * WHY: the app is a client-side React SPA — the shipped index.html has an empty
 * <div id="root">, so search engines that don't run JS (and Google's first pass)
 * see no content. This script loads each public route in a real headless browser
 * AFTER `vite build`, waits for React to render, and writes the fully-rendered
 * HTML to dist/<route>/index.html. Crawlers now receive real content; the app
 * still hydrates/takes over normally when JS runs.
 *
 * It is intentionally non-fatal: if a headless browser can't launch (e.g. missing
 * system libraries), it prints setup guidance and exits 0 so the normal SPA build
 * is still deployable — just without prerendering.
 *
 * Only static content pages are prerendered. Auth areas (/client-portal, /admin)
 * are excluded by design, and data-driven routes (blog articles) stay CSR.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = 5178;

// Public, static content routes worth indexing (must match App.jsx routes).
const ROUTES = [
  '/',
  '/about',
  '/services',
  '/industries',
  '/resources',
  '/blog',
  '/contact',
  '/privacy-policy',
  '/terms-and-conditions',
  '/services/bookkeeping',
  '/services/tax-services',
  '/services/payroll',
  '/services/accounting',
  '/services/consulting',
  '/services/registered-agent',
  '/services/bookkeeping-cleanup',
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
  '.xml': 'application/xml', '.map': 'application/json',
};

// Tiny static server for dist with SPA fallback to index.html.
function serveDist() {
  return http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(DIST, urlPath);
      if (urlPath === '/' || !path.extname(filePath)) {
        // route (no file extension) → serve the SPA shell so React can render it
        filePath = path.join(DIST, 'index.html');
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(500); res.end('err');
    }
  });
}

async function autoScroll(page) {
  // Trigger IntersectionObserver-based reveal animations / lazy content.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        y += step;
        if (y >= document.body.scrollHeight) { clearInterval(timer); window.scrollTo(0, 0); resolve(); }
      }, 60);
    });
  });
}

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('[prerender] dist/index.html not found — run `vite build` first.');
    process.exit(1);
  }

  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.warn('[prerender] puppeteer not installed — skipping prerender (SPA build left as-is).');
    process.exit(0);
  }

  const server = serveDist();
  await new Promise((r) => server.listen(PORT, r));

  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  } catch (err) {
    console.warn('\n[prerender] Could not launch headless Chrome — skipping prerender.');
    console.warn('           The normal SPA build is intact and deployable.');
    console.warn('           To enable prerendering on Linux/EC2, install Chrome deps, e.g.:');
    console.warn('           sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \\');
    console.warn('             libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \\');
    console.warn('             libgbm1 libasound2 libpangocairo-1.0-0 libgtk-3-0');
    console.warn(`           (reason: ${err.message})\n`);
    server.close();
    process.exit(0);
  }

  let ok = 0;
  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      const url = `http://127.0.0.1:${PORT}${route}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      } catch {
        // networkidle can hang on 3rd-party widgets; fall back to DOM content loaded
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
      }
      // Wait for React to actually render into #root, then settle animations.
      await page.waitForFunction('document.querySelector("#root") && document.querySelector("#root").children.length > 0', { timeout: 20000 }).catch(() => {});
      await autoScroll(page);
      await new Promise((r) => setTimeout(r, 500));

      // Mark as prerendered so the client entry can hydrate instead of re-rendering.
      await page.evaluate(() => document.documentElement.setAttribute('data-prerendered', 'true'));

      let html = await page.content();
      // Runtime-injected modulepreload/asset links get resolved against the local
      // prerender origin — rewrite them back to root-relative so they work in prod.
      html = html.split(`http://127.0.0.1:${PORT}`).join('').split(`http://localhost:${PORT}`).join('');
      html = '<!doctype html>\n' + html.replace(/^<!doctype html>/i, '').trimStart();

      const outDir = route === '/' ? DIST : path.join(DIST, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
      console.log(`[prerender] ✓ ${route}  →  ${path.relative(DIST, path.join(outDir, 'index.html'))}`);
      ok++;
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`\n[prerender] Done — ${ok}/${ROUTES.length} pages prerendered into dist/.`);
}

main().catch((err) => { console.error('[prerender] failed:', err); process.exit(1); });
