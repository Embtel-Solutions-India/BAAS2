const { Order, Message, toRows } = require('../models');

exports.getMessages = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, client_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const msgs = await Message.find({ order_id: req.params.orderId }).sort({ created_at: 1 });

    await Message.updateMany(
      { order_id: req.params.orderId, sender_role: 'admin', is_read: false },
      { is_read: true }
    );

    res.json({ messages: toRows(msgs) });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.sendMessage = async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body is required' });
  try {
    const order = await Order.findOne({ _id: req.params.orderId, client_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const msg = new Message({
      order_id: req.params.orderId,
      sender_id: req.user.id,
      sender_role: 'client',
      body: body.trim()
    });
    await msg.save();

    res.status(201).json({ message_id: msg.id });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ error: 'Failed to update' });
  }
};
