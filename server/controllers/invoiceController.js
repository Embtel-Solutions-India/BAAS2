const { Invoice, toRow } = require('../models');

exports.listInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ client_id: req.user.id })
      .populate('order_id', 'order_number')
      .sort({ created_at: -1 });

    const rows = invoices.map(inv => {
      const row = toRow(inv);
      row.order_number = inv.order_id ? inv.order_id.order_number : null;
      row.order_id = inv.order_id ? inv.order_id.id : null;
      return row;
    });

    res.json({ invoices: rows });
  } catch (err) {
    console.error('listInvoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, client_id: req.user.id })
      .populate('order_id', 'order_number')
      .populate('client_id', 'first_name last_name');
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const row = toRow(inv);
    row.order_number = inv.order_id ? inv.order_id.order_number : null;
    row.order_id = inv.order_id ? inv.order_id.id : null;
    row.client_name = inv.client_id ? `${inv.client_id.first_name} ${inv.client_id.last_name}` : null;
    row.client_id = inv.client_id ? inv.client_id.id : null;

    res.json({ invoice: row });
  } catch (err) {
    console.error('getInvoice error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};
