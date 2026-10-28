/**
 * Simulates "JavaScript disabled": plain HTTP GET against the prerendered
 * dist/ output (no browser, no JS execution) for all 16 marketing routes.
 * Checks acceptance criteria 1-3: full content in raw HTML, distinct
 * title/description per page, and a self-referencing canonical.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = 5179;

const ROUTES = [
  '/', '/about', '/services', '/industries', '/resources', '/blog', '/contact',
  '/privacy-policy', '/terms-and-conditions', '/services/bookkeeping',
  '/services/tax-services', '/services/payroll',
  '/services/consulting', '/services/registered-agent', '/services/bookkeeping-cleanup',
  '/services/contractors',
  '/services/foreign-owned-llc-accounting',
  '/services/fractional-cfo',
  '/rush-service',
  '/book',
];

function serveDist() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(DIST, urlPath);
    if (urlPath === '/' || !path.extname(filePath)) filePath = path.join(filePath, 'index.html');
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(filePath).pipe(res);
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function main() {
  const server = serveDist();
  await new Promise((r) => server.listen(PORT, r));

  const titles = new Set();
  const descriptions = new Set();
  let failures = 0;

  for (const route of ROUTES) {
    const html = await get(`http://127.0.0.1:${PORT}${route}`);

    const withoutScripts = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ');
    const visibleText = withoutScripts.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];

    const problems = [];
    if (visibleText.length < 200) problems.push(`root content too thin (${visibleText.length} chars)`);
    if (!title) problems.push('missing title');
    else if (titles.has(title)) problems.push(`duplicate title: "${title}"`);
    if (!desc) problems.push('missing description');
    else if (descriptions.has(desc)) problems.push(`duplicate description`);
    if (!canonical) problems.push('missing canonical');
    else if (!canonical.endsWith(route === '/' ? '/' : route)) problems.push(`canonical mismatch: ${canonical}`);

    if (title) titles.add(title);
    if (desc) descriptions.add(desc);

    if (problems.length) {
      failures++;
      console.log(`✗ ${route}`);
      problems.forEach((p) => console.log(`    - ${p}`));
    } else {
      console.log(`✓ ${route}  (${visibleText.length} chars of visible content, title/desc/canonical all present + unique)`);
    }
  }

  server.close();
  console.log(`\n${ROUTES.length - failures}/${ROUTES.length} routes passed the no-JS content check.`);
  process.exit(failures ? 1 : 0);
}

main();
