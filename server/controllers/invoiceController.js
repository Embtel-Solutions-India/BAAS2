const fs = require('fs');
const { Invoice, toRow } = require('../models');
const invoiceService = require('../services/invoiceService');

// Never leak the absolute server file path to clients; expose a boolean instead.
function sanitize(row) {
  row.has_pdf = !!row.file_path;
  delete row.file_path;
  return row;
}

exports.listInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ client_id: req.user.id })
      .populate('order_id', 'order_number')
      .sort({ created_at: -1 });

    const rows = invoices.map(inv => {
      const row = toRow(inv);
      row.order_number = inv.order_id ? inv.order_id.order_number : null;
      row.order_id = inv.order_id ? inv.order_id.id : null;
      return sanitize(row);
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

    res.json({ invoice: sanitize(row) });
  } catch (err) {
    console.error('getInvoice error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// GET /api/invoices/order/:orderId — the invoice attached to one of my orders
exports.getInvoiceByOrder = async (req, res) => {
  try {
    const inv = await Invoice.findOne({ order_id: req.params.orderId, client_id: req.user.id })
      .sort({ created_at: -1 })
      .populate('order_id', 'order_number');
    if (!inv) return res.json({ invoice: null });

    const row = toRow(inv);
    row.order_number = inv.order_id ? inv.order_id.order_number : null;
    row.order_id = inv.order_id ? inv.order_id.id : null;
    res.json({ invoice: sanitize(row) });
  } catch (err) {
    console.error('getInvoiceByOrder error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

/**
 * GET /api/invoices/:id/download        → attachment
 * GET /api/invoices/:id/download?inline=1 → inline (view / print in browser)
 * Ownership is verified before the file is served; missing files are regenerated.
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, client_id: req.user.id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const { filePath, fileName } = await invoiceService.ensureInvoiceFile(inv._id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Invoice file unavailable' });

    const inline = req.query.inline === '1' || req.query.disposition === 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('downloadInvoice error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to download invoice' });
  }
};
