require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
require('./config/db');
require('./scripts/seedAdmin');
require('./scripts/seedServices');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .concat(['http://localhost:4000', 'http://127.0.0.1:4000', 'http://localhost:5173', 'http://127.0.0.1:5173']);

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
app.use('/api/documents',     require('./routes/documents'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/invoices',      require('./routes/invoices'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/admin/payments', require('./routes/adminPayments'));
app.use('/api/admin/invoices', require('./routes/adminInvoices'));
app.use('/api/admin/blogs',   require('./routes/adminBlogs'));
app.use('/api/blogs',         require('./routes/blogs'));
app.use('/api/quickbooks',    require('./routes/quickbooks'));
app.use('/api/chat',          require('./routes/chat'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

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
