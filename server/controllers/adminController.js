const {
  Admin,
  Client,
  Order,
  OrderStatusHistory,
  Document,
  Message,
  Notification,
  ActivityLog,
  Payment,
  Service,
  Blog,
  toRow,
  toRows
} = require('../models');

exports.getDashboardStats = async (req, res) => {
  try {
    const total_clients = await Client.countDocuments();
    const total_orders  = await Order.countDocuments();
    const pending_orders = await Order.countDocuments({ status: 'pending' });

    const paymentAgg = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenue = paymentAgg.length ? paymentAgg[0].total : 0;

    // Blog statistics
    const total_blogs = await Blog.countDocuments();
    const published_blogs = await Blog.countDocuments({ status: 'published' });
    const draft_blogs = await Blog.countDocuments({ status: 'draft' });

    // User statistics
    const total_admins = await Admin.countDocuments();
    const total_users = total_clients + total_admins;

    // Recent activity
    const recentActivities = await ActivityLog.find()
      .populate('admin_id', 'name')
      .sort({ created_at: -1 })
      .limit(10);

    const recentActivitiesRows = recentActivities.map(l => {
      const row = toRow(l);
      row.admin_name = l.admin_id ? l.admin_id.name : 'System';
      return row;
    });

    // Recent blogs
    const recentBlogs = await Blog.find()
      .sort({ created_at: -1 })
      .limit(5);

    // Blog category statistics
    const blogStatsAgg = await Blog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const blog_stats = blogStatsAgg.map(item => ({ category: item._id, count: item.count }));

    // User growth per month
    const userGrowthAgg = await Client.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const user_growth = userGrowthAgg.map(item => ({ month: item._id, count: item.count }));

    // Monthly activity logs
    const monthlyActivityAgg = await ActivityLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const monthly_activity = monthlyActivityAgg.map(item => ({ month: item._id, count: item.count }));

    // ── Payment analytics (additive) ──
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const trendStart = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 11, 1);

    const [todayPayAgg, monthPayAgg, payStatusAgg, payTrendAgg, recentPaymentsRaw, pendingOrderCount] = await Promise.all([
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
      Payment.find()
        .populate('client_id', 'first_name last_name')
        .sort({ created_at: -1 })
        .limit(8),
      Order.countDocuments({ payment_status: { $in: ['unpaid', 'pending', 'processing'] }, status: { $ne: 'cancelled' } })
    ]);

    const payByStatus = {};
    for (const s of payStatusAgg) payByStatus[s._id] = { count: s.count, amount: s.amount };

    const succeededCount = payByStatus.completed?.count || 0;
    const failedCount = payByStatus.failed?.count || 0;
    const attemptedCount = succeededCount + failedCount;

    const recent_payments = recentPaymentsRaw.map(p => {
      const row = toRow(p);
      row.client_name = p.client_id ? `${p.client_id.first_name} ${p.client_id.last_name}` : null;
      row.client_id = p.client_id ? p.client_id.id : null;
      return row;
    });

    const payment_analytics = {
      today_revenue: todayPayAgg.length ? todayPayAgg[0].total : 0,
      month_revenue: monthPayAgg.length ? monthPayAgg[0].total : 0,
      pending_payments: payByStatus.pending?.count || 0,
      successful_payments: succeededCount,
      failed_payments: failedCount,
      refunded_payments: payByStatus.refunded?.count || 0,
      success_rate: attemptedCount ? Math.round((succeededCount / attemptedCount) * 100) : null,
      pending_orders: pendingOrderCount,
      monthly_revenue: payTrendAgg.map(t => ({ month: t._id, revenue: t.revenue, count: t.count }))
    };

    res.json({
      total_clients,
      total_orders,
      pending_orders,
      revenue,
      total_blogs,
      published_blogs,
      draft_blogs,
      total_users,
      recent_activities: recentActivitiesRows,
      recent_blogs: toRows(recentBlogs),
      blog_stats,
      user_growth,
      monthly_activity,
      payment_analytics,
      recent_payments
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

/**
 * Additive: time-series analytics for the dashboard charts.
 * GET /api/admin/analytics?granularity=day|month|year
 * Returns user growth (new clients) and activity counts grouped by the chosen
 * granularity over a sensible recent window. Does not touch /stats.
 */
exports.getAnalytics = async (req, res) => {
  try {
    const gran = ['day', 'month', 'year'].includes(req.query.granularity) ? req.query.granularity : 'month';
    const fmt  = gran === 'day' ? '%Y-%m-%d' : gran === 'year' ? '%Y' : '%Y-%m';

    const now = new Date();
    let since;
    if (gran === 'day')       { since = new Date(now); since.setDate(now.getDate() - 29); since.setHours(0, 0, 0, 0); }
    else if (gran === 'year') { since = new Date(now.getFullYear() - 5, 0, 1); }
    else                      { since = new Date(now.getFullYear(), now.getMonth() - 11, 1); }

    const series = async (Model) => {
      const rows = await Model.aggregate([
        { $match: { created_at: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: fmt, date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      return rows.map(r => ({ period: r._id, count: r.count }));
    };

    const [user_growth, activity] = await Promise.all([ series(Client), series(ActivityLog) ]);
    res.json({ granularity: gran, user_growth, activity });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

exports.listClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ created_at: -1 });
    res.json({ clients: toRows(clients) });
  } catch (err) {
    console.error('listClients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const orders = await Order.find({ client_id: req.params.id })
      .populate('service_id', 'name')
      .sort({ created_at: -1 });

    const orderRows = orders.map(o => {
      const row = toRow(o);
      row.service_name = o.service_id ? o.service_id.name : null;
      row.service_id = o.service_id ? o.service_id.id : null;
      return row;
    });

    res.json({ client: toRow(client), orders: orderRows });
  } catch (err) {
    console.error('getClient error:', err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
};

exports.toggleClientStatus = async (req, res) => {
  const { is_active } = req.body;
  try {
    await Client.findByIdAndUpdate(req.params.id, { is_active: is_active ? true : false });

    const log = new ActivityLog({
      admin_id: req.user.id,
      action: is_active ? 'activate_client' : 'deactivate_client',
      entity_type: 'client',
      entity_id: req.params.id
    });
    await log.save();

    res.json({ message: `Client ${is_active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error('toggleClientStatus error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('client_id', 'first_name last_name')
      .populate('service_id', 'name')
      .sort({ created_at: -1 });

    const orderRows = orders.map(o => {
      const row = toRow(o);
      row.client_name = o.client_id ? `${o.client_id.first_name} ${o.client_id.last_name}` : null;
      row.client_id = o.client_id ? o.client_id.id : null;
      row.service_name = o.service_id ? o.service_id.name : null;
      row.service_id = o.service_id ? o.service_id.id : null;
      return row;
    });

    res.json({ orders: orderRows });
  } catch (err) {
    console.error('admin listOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client_id', 'first_name last_name')
      .populate('service_id', 'name');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const history = await OrderStatusHistory.find({ order_id: req.params.id }).sort({ created_at: 1 });
    const docs = await Document.find({ order_id: req.params.id }).sort({ created_at: -1 });

    const orderRow = toRow(order);
    orderRow.client_name = order.client_id ? `${order.client_id.first_name} ${order.client_id.last_name}` : null;
    orderRow.client_id = order.client_id ? order.client_id.id : null;
    orderRow.service_name = order.service_id ? order.service_id.name : null;
    orderRow.service_id = order.service_id ? order.service_id.id : null;

    res.json({ order: orderRow, history: toRows(history), documents: toRows(docs) });
  } catch (err) {
    console.error('admin getOrder error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  const VALID = ['pending','in_review','processing','submitted','approved','completed','cancelled'];
  if (!VALID.includes(status))
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID.join(', ')}` });
  try {
    await Order.findByIdAndUpdate(req.params.id, { status, updated_at: new Date() });

    const osh = new OrderStatusHistory({
      order_id: req.params.id,
      status,
      changed_by: `admin:${req.user.id}`,
      note: note || null
    });
    await osh.save();

    const order = await Order.findById(req.params.id);
    if (order) {
      const notif = new Notification({
        client_id: order.client_id,
        type: 'order_update',
        title: `Your order status has been updated to: ${status}`,
        body: note || `Your order has been moved to ${status}.`
      });
      await notif.save();
    }

    const log = new ActivityLog({
      admin_id: req.user.id,
      action: `order_status_${status}`,
      entity_type: 'order',
      entity_id: req.params.id
    });
    await log.save();

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const msgs = await Message.find({ order_id: req.params.orderId }).sort({ created_at: 1 });

    await Message.updateMany(
      { order_id: req.params.orderId, sender_role: 'client', is_read: false },
      { is_read: true }
    );

    res.json({ messages: toRows(msgs) });
  } catch (err) {
    console.error('admin getMessages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.sendMessage = async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Message body is required' });
  try {
    const msg = new Message({
      order_id: req.params.orderId,
      sender_id: req.user.id,
      sender_role: 'admin',
      body: body.trim()
    });
    await msg.save();

    const order = await Order.findById(req.params.orderId);
    if (order) {
      const notif = new Notification({
        client_id: order.client_id,
        type: 'message',
        title: 'New message from your advisor',
        body: body.trim().substring(0, 120)
      });
      await notif.save();
    }

    res.status(201).json({ message_id: msg.id });
  } catch (err) {
    console.error('admin sendMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.createNotification = async (req, res) => {
  const { client_id, type, title, body } = req.body;
  if (!client_id || !title || !body)
    return res.status(400).json({ error: 'client_id, title, and body are required' });
  try {
    const notif = new Notification({
      client_id,
      type: type || 'general',
      title,
      body
    });
    await notif.save();

    res.status(201).json({ message: 'Notification sent' });
  } catch (err) {
    console.error('createNotification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('admin_id', 'name')
      .sort({ created_at: -1 })
      .limit(200);

    const logRows = logs.map(l => {
      const row = toRow(l);
      row.admin_name = l.admin_id ? l.admin_id.name : null;
      row.admin_id = l.admin_id ? l.admin_id.id : null;
      return row;
    });

    res.json({ logs: logRows });
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};
