require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');
require('./config/db');
require('./scripts/seedAdmin');
// Services are now fully admin-managed (no seeded catalog). This idempotently
// retires any legacy seeded services so the catalog starts empty.
require('./scripts/retireSeededServices');

const app  = express();
const PORT = process.env.PORT || 4000;

// Behind the nginx TLS proxy on EC2: trust X-Forwarded-* so req.secure /
// req.protocol / req.ip are correct (needed for Secure cookies over HTTPS and
// accurate per-IP rate limiting).
app.set('trust proxy', 1);

app.use(helmet());
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  // 5173/4000 are the Vite dev server and this API; 5178 is the local static
  // server the build-time prerender script (react-app/scripts/prerender.mjs)
  // uses to headlessly render each route — without it, any page that fetches
  // data (e.g. /blog) gets its API calls CORS-rejected during prerendering
  // and ships with no data baked into its static HTML.
  .concat(['http://localhost:4000', 'http://127.0.0.1:4000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5178', 'http://127.0.0.1:5178']);

app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

// Capture raw body for QuickBooks webhook signature verification.
// The webhook route reads req.rawBody; all other routes use JSON.
app.use('/api/quickbooks/webhook', express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/documents',     require('./routes/documents'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/invoices',      require('./routes/invoices'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/admin/payments', require('./routes/adminPayments'));
app.use('/api/admin/invoices', require('./routes/adminInvoices'));
app.use('/api/admin/services', require('./routes/adminServices'));
app.use('/api/admin/blogs',   require('./routes/adminBlogs'));
app.use('/api/media',         require('./routes/media'));
app.use('/api/blogs',         require('./routes/blogs'));
app.use('/api/quickbooks',    require('./routes/quickbooks'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/rush-requests', require('./routes/rushRequests'));
app.use('/api/contact-requests', require('./routes/contactRequests'));
app.use('/api/quote-requests', require('./routes/quoteRequests'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

// Blog articles are CSR-only (never prerendered — see react-app/scripts/
// prerender.mjs), so nginx can't tell a real slug from an invented one by
// looking at the filesystem alone. It falls back to proxying unmatched
// /blog/<slug> requests here so we can check the database directly and
// return a real 404 for bad slugs, exactly like /api/blogs/:slug already
// does — without requiring every article to be prerendered (which would
// make a newly published post 404 until the next deploy).
//
// IMPORTANT: this must be the neutral pre-prerender shell (shell.html), not
// dist/index.html — the prerender script overwrites index.html with the
// *home page's* own rendered content (title/canonical/JSON-LD), which would
// otherwise ship under every blog article's URL too.
const FRONTEND_SHELL = process.env.FRONTEND_SHELL_PATH
  || path.join(__dirname, '..', 'react-app', 'dist', 'shell.html');

let shellHtmlCache;
function readShellHtml() {
  if (shellHtmlCache === undefined) {
    shellHtmlCache = fs.existsSync(FRONTEND_SHELL) ? fs.readFileSync(FRONTEND_SHELL, 'utf8') : null;
  }
  return shellHtmlCache;
}

// /blog/<slug> and /blog/page/<n>: server-rendered SEO + content for crawlers (see routes/blogPages.js)
app.use(require('./routes/blogPages')({ readShell: readShellHtml }));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── HTTP server + Socket.IO (real-time chat) ──────────────────────
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./socket');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
  connectionStateRecovery: {}   // auto connection-recovery on brief drops
});
app.set('io', io);              // let REST controllers emit real-time events
initSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 BAAS Portal API running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO real-time chat ready`);
});
