const { Notification, toRows } = require('../models');

exports.listNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ client_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(50);
    res.json({ notifications: toRows(notifs) });
  } catch (err) {
    console.error('listNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, client_id: req.user.id },
      { is_read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { client_id: req.user.id },
      { is_read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};
