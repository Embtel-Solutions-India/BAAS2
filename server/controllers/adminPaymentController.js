const qb = require('../services/quickbooks');
const {
  Order,
  Payment,
  Invoice,
  Notification,
  ActivityLog,
  Client,
  toRow
} = require('../models');

function buildPaymentQuery(qs) {
  const query = {};
  if (qs.status && qs.status !== 'all') query.status = qs.status;
  if (qs.client_id) query.client_id = Number(qs.client_id);
  if (qs.gateway) query.gateway = qs.gateway;
  if (qs.from || qs.to) {
    query.created_at = {};
    if (qs.from) query.created_at.$gte = new Date(qs.from);
    if (qs.to) {
      const to = new Date(qs.to);
      to.setHours(23, 59, 59, 999);
      query.created_at.$lte = to;
    }
  }
  return query;
}

async function decoratePayments(payments) {
  const orderIds = [...new Set(payments.filter(p => p.order_id).map(p => p.order_id))];
  const clientIds = [...new Set(payments.map(p => p.client_id))];
  const [orders, clients] = await Promise.all([
    Order.find({ _id: { $in: orderIds } }).select('order_number'),
    Client.find({ _id: { $in: clientIds } }).select('first_name last_name email')
  ]);
  const orderMap = new Map(orders.map(o => [o.id, o]));
  const clientMap = new Map(clients.map(c => [c.id, c]));

  return payments.map(p => {
    const row = toRow(p);
    const order = orderMap.get(p.order_id);
    const client = clientMap.get(p.client_id);
    row.order_number = order ? order.order_number : null;
    row.client_name = client ? `${client.first_name} ${client.last_name}` : null;
    row.client_email = client ? client.email : null;
    return row;
  });
}

/**
 * GET /api/admin/payments
 * Query: page, limit, status, client_id, from, to, search (order # / client name / txn id)
 */
exports.listPayments = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = buildPaymentQuery(req.query);

    const search = (req.query.search || '').trim();
    if (search) {
      const [matchingClients, matchingOrders] = await Promise.all([
        Client.find({
          $or: [
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id'),
        Order.find({ order_number: { $regex: search, $options: 'i' } }).select('_id')
      ]);
      query.$or = [
        { transaction_id: { $regex: search, $options: 'i' } },
        { qb_payment_id: { $regex: search, $options: 'i' } },
        { client_id: { $in: matchingClients.map(c => c.id) } },
        { order_id: { $in: matchingOrders.map(o => o.id) } }
      ];
    }

    const [total, payments] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ]);

    res.json({
      payments: await decoratePayments(payments),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (err) {
    console.error('admin listPayments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

/**
 * GET /api/admin/payments/analytics
 * Revenue KPIs, status counts, success rate and 12-month trend.
 */
exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [totals, todayAgg, monthAgg, statusCounts, trendAgg, pendingOrders] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, refunded: { $sum: '$refunded_amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', created_at: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', created_at: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', created_at: { $gte: trendStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.countDocuments({ payment_status: { $in: ['unpaid', 'pending', 'processing'] }, status: { $ne: 'cancelled' } })
    ]);

    const byStatus = {};
    for (const s of statusCounts) byStatus[s._id] = { count: s.count, amount: s.amount };

    const succeeded = byStatus.completed?.count || 0;
    const failed = byStatus.failed?.count || 0;
    const attempted = succeeded + failed;

    res.json({
      total_revenue: totals.length ? totals[0].total : 0,
      total_refunded: totals.length ? totals[0].refunded : 0,
      today_revenue: todayAgg.length ? todayAgg[0].total : 0,
      month_revenue: monthAgg.length ? monthAgg[0].total : 0,
      pending_payments: byStatus.pending?.count || 0,
      processing_payments: byStatus.processing?.count || 0,
      successful_payments: succeeded,
      failed_payments: failed,
      refunded_payments: byStatus.refunded?.count || 0,
      success_rate: attempted ? Math.round((succeeded / attempted) * 100) : null,
      pending_orders: pendingOrders,
      monthly_trend: trendAgg.map(t => ({ month: t._id, revenue: t.revenue, count: t.count }))
    });
  } catch (err) {
    console.error('payment analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
};

/**
 * POST /api/admin/payments/:id/refund
 * Body: { amount?, reason? }  — full refund when amount omitted.
 */
exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'completed')
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    if (payment.gateway !== 'quickbooks' || !payment.qb_payment_id)
      return res.status(400).json({ error: 'This payment was not processed through QuickBooks' });

    const refundable = Number(payment.amount) - Number(payment.refunded_amount || 0);
    const amount = req.body.amount != null ? Number(req.body.amount) : refundable;
    if (!(amount > 0) || amount > refundable + 0.001)
      return res.status(400).json({ error: `Invalid refund amount. Refundable: $${refundable.toFixed(2)}` });

    const reason = (req.body.reason || '').trim();
    const refund = await qb.refundCharge(payment.qb_payment_id, amount.toFixed(2), reason || 'Refund issued by BAAS admin');

    payment.refunded_amount = Number(payment.refunded_amount || 0) + amount;
    payment.refund_id = refund.id ? String(refund.id) : payment.refund_id;
    const fullyRefunded = payment.refunded_amount >= Number(payment.amount) - 0.001;
    if (fullyRefunded) payment.status = 'refunded';
    payment.updated_at = new Date();
    await payment.save();

    if (payment.order_id && fullyRefunded) {
      await Order.findByIdAndUpdate(payment.order_id, { payment_status: 'refunded', updated_at: new Date() });
    }
    if (payment.invoice_id && fullyRefunded) {
      await Invoice.findByIdAndUpdate(payment.invoice_id, { status: 'cancelled' });
    }

    const notif = new Notification({
      client_id: payment.client_id,
      type: 'payment',
      title: 'Refund processed',
      body: `A refund of $${amount.toFixed(2)} has been issued to your card.${reason ? ` Reason: ${reason}` : ''}`
    });
    await notif.save();

    const log = new ActivityLog({
      admin_id: req.user.id,
      action: 'payment_refunded',
      entity_type: 'payment',
      entity_id: payment.id,
      meta: { amount, reason: reason || null, refund_id: payment.refund_id }
    });
    await log.save();

    res.json({
      message: `Refund of $${amount.toFixed(2)} processed`,
      refund_id: payment.refund_id,
      payment_status: payment.status,
      refunded_amount: payment.refunded_amount
    });
  } catch (err) {
    console.error('refundPayment error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Refund failed' });
  }
};

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/admin/payments/export/payments — CSV export (same filters as list)
 */
exports.exportPayments = async (req, res) => {
  try {
    const query = buildPaymentQuery(req.query);
    const payments = await Payment.find(query).sort({ created_at: -1 }).limit(5000);
    const rows = await decoratePayments(payments);

    const header = ['Payment ID', 'Order #', 'Client', 'Email', 'Amount', 'Currency', 'Status', 'Method', 'Gateway', 'Transaction ID', 'Refunded', 'Created At'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        r.id, r.order_number, r.client_name, r.client_email, Number(r.amount).toFixed(2),
        r.currency, r.status, r.method, r.gateway, r.transaction_id,
        Number(r.refunded_amount || 0).toFixed(2), new Date(r.created_at).toISOString()
      ].map(csvEscape).join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) {
    console.error('exportPayments error:', err);
    res.status(500).json({ error: 'Failed to export payments' });
  }
};

/**
 * GET /api/admin/payments/export/orders — CSV export of orders
 */
exports.exportOrders = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    if (req.query.payment_status && req.query.payment_status !== 'all') query.payment_status = req.query.payment_status;

    const orders = await Order.find(query)
      .populate('client_id', 'first_name last_name email')
      .populate('service_id', 'name')
      .sort({ created_at: -1 })
      .limit(5000);

    const header = ['Order #', 'Client', 'Email', 'Service', 'State', 'Status', 'Payment Status', 'Amount', 'Currency', 'Transaction ID', 'Created At'];
    const lines = [header.join(',')];
    for (const o of orders) {
      lines.push([
        o.order_number,
        o.client_id ? `${o.client_id.first_name} ${o.client_id.last_name}` : '',
        o.client_id ? o.client_id.email : '',
        o.service_id ? o.service_id.name : '',
        o.state, o.status, o.payment_status,
        Number(o.total_amount || 0).toFixed(2), o.currency || 'USD',
        o.transaction_id || '', new Date(o.created_at).toISOString()
      ].map(csvEscape).join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) {
    console.error('exportOrders error:', err);
    res.status(500).json({ error: 'Failed to export orders' });
  }
};
