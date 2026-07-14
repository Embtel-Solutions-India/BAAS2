const { Order, Service, OrderStatusHistory, Notification, ActivityLog, toRow, toRows } = require('../models');

// Fire-and-forget audit + client notification. Never allowed to break the
// core order flow, so failures are swallowed with a log.
async function notifyOrderEvent({ clientId, title, body, action, orderId, meta }) {
  try {
    await new Notification({ client_id: clientId, type: 'order_update', title, body }).save();
    await new ActivityLog({ admin_id: null, action, entity_type: 'order', entity_id: orderId, meta: meta || {} }).save();
  } catch (err) {
    console.error(`notifyOrderEvent(${action}) failed:`, err.message);
  }
}

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find({ client_id: req.user.id })
      .populate('service_id', 'name')
      .populate('company_id', 'legal_name')
      .sort({ created_at: -1 });

    const rows = orders.map(o => {
      const row = toRow(o);
      row.service_name = o.service_id ? o.service_id.name : null;
      row.service_id = o.service_id ? o.service_id.id : null;
      row.company_name = o.company_id ? o.company_id.legal_name : null;
      row.company_id = o.company_id ? o.company_id.id : null;
      return row;
    });

    res.json({ orders: rows });
  } catch (err) {
    console.error('listOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, client_id: req.user.id })
      .populate('service_id', 'name');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const history = await OrderStatusHistory.find({ order_id: req.params.id }).sort({ created_at: 1 });

    const row = toRow(order);
    row.service_name = order.service_id ? order.service_id.name : null;
    row.service_id = order.service_id ? order.service_id.id : null;

    res.json({ order: row, history: toRows(history) });
  } catch (err) {
    console.error('getOrder error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.createOrder = async (req, res) => {
  const { service_id, company_id, state, notes } = req.body;
  if (!service_id || !state)
    return res.status(400).json({ error: 'service_id and state are required' });
  try {
    const svc = await Service.findOne({ _id: service_id, is_active: true });
    if (!svc) return res.status(404).json({ error: 'Service not found' });

    const order_number = `BAAS-${Date.now()}`;
    const order = new Order({
      client_id: req.user.id,
      company_id: company_id || null,
      service_id,
      order_number,
      status: 'pending',
      state: state.toUpperCase(),
      notes: notes || null,
      total_amount: svc.price
    });
    await order.save();

    const osh = new OrderStatusHistory({
      order_id: order.id,
      status: 'pending',
      changed_by: `client:${req.user.id}`,
      note: 'Order placed'
    });
    await osh.save();

    await notifyOrderEvent({
      clientId: req.user.id,
      title: 'Order placed',
      body: `Your order ${order_number} has been placed successfully. Complete payment to get started.`,
      action: 'order_created',
      orderId: order.id,
      meta: { order_number, service_id, total: order.total_amount }
    });

    res.status(201).json({
      message:      'Order created successfully',
      order_id:     order.id,
      order_number
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, client_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['pending', 'in_review'].includes(order.status))
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });

    order.status = 'cancelled';
    order.updated_at = new Date();
    await order.save();

    const osh = new OrderStatusHistory({
      order_id: req.params.id,
      status: 'cancelled',
      changed_by: `client:${req.user.id}`,
      note: 'Cancelled by client'
    });
    await osh.save();

    await notifyOrderEvent({
      clientId: req.user.id,
      title: 'Order cancelled',
      body: `Your order ${order.order_number} has been cancelled.`,
      action: 'order_cancelled',
      orderId: order.id,
      meta: { order_number: order.order_number }
    });

    res.json({ message: 'Order cancelled' });
  } catch (err) {
    console.error('cancelOrder error:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};
