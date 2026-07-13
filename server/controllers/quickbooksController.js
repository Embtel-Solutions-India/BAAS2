const jwt = require('jsonwebtoken');
const qb = require('../services/quickbooks');
const {
  Order,
  Payment,
  Invoice,
  Notification,
  ActivityLog
} = require('../models');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev_secret';

function frontendBase() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
}

/* ─────────────────── Admin: connection management ─────────────────── */

// GET /api/quickbooks/connect  (admin) → returns the Intuit authorize URL
exports.connect = async (req, res) => {
  if (!qb.isConfigured()) {
    return res.status(503).json({ error: 'QuickBooks credentials are not configured on the server (.env).' });
  }
  const state = jwt.sign({ purpose: 'qb_oauth', admin_id: req.user.id }, JWT_SECRET(), { expiresIn: '10m' });
  res.json({ url: qb.buildAuthorizeUrl(state) });
};

// GET /api/quickbooks/callback  (public — Intuit redirects here)
exports.callback = async (req, res) => {
  const { code, state, realmId, error } = req.query;
  const redirect = (result) => res.redirect(`${frontendBase()}/admin/payments?qb=${result}`);

  if (error || !code || !state || !realmId) return redirect('error');

  let decoded;
  try {
    decoded = jwt.verify(state, JWT_SECRET());
    if (decoded.purpose !== 'qb_oauth') throw new Error('bad state');
  } catch {
    return redirect('invalid_state');
  }

  try {
    await qb.exchangeCodeForTokens(code, realmId, decoded.admin_id || null);

    const log = new ActivityLog({
      admin_id: decoded.admin_id || null,
      action: 'quickbooks_connected',
      entity_type: 'quickbooks',
      meta: { realm_id: String(realmId), environment: qb.ENV() }
    });
    await log.save();

    return redirect('connected');
  } catch (err) {
    console.error('QuickBooks callback error:', err);
    return redirect('error');
  }
};

// GET /api/quickbooks/status  (admin)
exports.status = async (req, res) => {
  try {
    const conn = await qb.getConnection();
    res.json({
      configured: qb.isConfigured(),
      connected: Boolean(conn),
      environment: qb.ENV(),
      realm_id: conn ? conn.realm_id : null,
      connected_at: conn ? conn.created_at : null,
      token_refreshed_at: conn ? conn.updated_at : null,
      reconnect_required: conn ? (conn.refresh_expires_at && conn.refresh_expires_at < new Date()) : false
    });
  } catch (err) {
    console.error('QuickBooks status error:', err);
    res.status(500).json({ error: 'Failed to fetch QuickBooks status' });
  }
};

// POST /api/quickbooks/disconnect  (admin)
exports.disconnect = async (req, res) => {
  try {
    const removed = await qb.revokeConnection();
    if (removed) {
      const log = new ActivityLog({
        admin_id: req.user.id,
        action: 'quickbooks_disconnected',
        entity_type: 'quickbooks'
      });
      await log.save();
    }
    res.json({ message: removed ? 'QuickBooks disconnected' : 'No QuickBooks connection found' });
  } catch (err) {
    console.error('QuickBooks disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect QuickBooks' });
  }
};

/* ─────────────────────────── Webhook ─────────────────────────── */

async function syncPaymentFromWebhook(entity) {
  const qbId = entity.id ? String(entity.id) : null;
  if (!qbId) return;

  const payment = await Payment.findOne({ qb_payment_id: qbId });
  if (!payment) return;

  let charge;
  try {
    charge = await qb.getCharge(qbId);
  } catch (err) {
    console.warn(`Webhook: unable to fetch charge ${qbId}:`, err.message);
    return;
  }

  const map = {
    AUTHORIZED: 'processing',
    CAPTURED: 'completed',
    SETTLED: 'completed',
    DECLINED: 'failed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  };
  const newStatus = map[charge.status] || payment.status;
  if (newStatus === payment.status) return;

  const oldStatus = payment.status;
  payment.status = newStatus;
  payment.updated_at = new Date();
  await payment.save();

  if (payment.order_id) {
    const orderPayMap = { completed: 'paid', failed: 'failed', refunded: 'refunded', cancelled: 'cancelled', processing: 'processing' };
    await Order.findByIdAndUpdate(payment.order_id, {
      payment_status: orderPayMap[newStatus] || 'pending',
      updated_at: new Date()
    });
  }

  if (payment.invoice_id && newStatus === 'completed') {
    await Invoice.findByIdAndUpdate(payment.invoice_id, { status: 'paid', paid_at: new Date() });
  }

  const titles = {
    completed: 'Payment successful',
    failed: 'Payment failed',
    refunded: 'Refund processed',
    cancelled: 'Payment cancelled'
  };
  if (titles[newStatus]) {
    const notif = new Notification({
      client_id: payment.client_id,
      type: 'payment',
      title: titles[newStatus],
      body: `Payment of $${Number(payment.amount).toFixed(2)} is now ${newStatus}.`
    });
    await notif.save();
  }

  const log = new ActivityLog({
    admin_id: null,
    action: `payment_webhook_${newStatus}`,
    entity_type: 'payment',
    entity_id: payment.id,
    meta: { qb_payment_id: qbId, from: oldStatus, to: newStatus }
  });
  await log.save();
}

// POST /api/quickbooks/webhook  (public — signature verified)
exports.webhook = async (req, res) => {
  const signature = req.get('intuit-signature');
  if (!qb.verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  // Acknowledge immediately; process asynchronously.
  res.status(200).json({ received: true });

  try {
    const notifications = (req.body && req.body.eventNotifications) || [];
    for (const notification of notifications) {
      const entities = notification.dataChangeEvent?.entities || [];
      for (const entity of entities) {
        const name = (entity.name || '').toLowerCase();
        if (name === 'payment' || name === 'charge') {
          await syncPaymentFromWebhook(entity);
        } else if (name === 'invoice') {
          const log = new ActivityLog({
            admin_id: null,
            action: `invoice_webhook_${(entity.operation || 'update').toLowerCase()}`,
            entity_type: 'invoice',
            meta: { qb_invoice_id: entity.id ? String(entity.id) : null }
          });
          await log.save();
        }
      }
    }
  } catch (err) {
    console.error('QuickBooks webhook processing error:', err);
  }
};
