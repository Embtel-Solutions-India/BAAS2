const fs = require('fs');
const { Invoice, Order, Client, toRow } = require('../models');
const invoiceService = require('../services/invoiceService');

function buildInvoiceQuery(qs) {
  const query = {};
  if (qs.status && qs.status !== 'all') query.status = qs.status;
  if (qs.client_id) query.client_id = Number(qs.client_id);
  if (qs.order_id) query.order_id = Number(qs.order_id);
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

// Key maps by numeric _id — invoice.order_id/client_id are Numbers while the
// Mongoose `.id` virtual is a String (mismatched Map keys drop the joins).
async function decorateInvoices(invoices) {
  const orderIds = [...new Set(invoices.filter(i => i.order_id).map(i => i.order_id))];
  const clientIds = [...new Set(invoices.map(i => i.client_id))];
  const [orders, clients] = await Promise.all([
    Order.find({ _id: { $in: orderIds } }).select('order_number'),
    Client.find({ _id: { $in: clientIds } }).select('first_name last_name email')
  ]);
  const orderMap = new Map(orders.map(o => [Number(o._id), o]));
  const clientMap = new Map(clients.map(c => [Number(c._id), c]));

  return invoices.map(inv => {
    const row = toRow(inv);
    const order = orderMap.get(Number(inv.order_id));
    const client = clientMap.get(Number(inv.client_id));
    row.order_number = order ? order.order_number : null;
    row.client_name = client ? `${client.first_name} ${client.last_name}` : null;
    row.client_email = client ? client.email : null;
    row.has_pdf = !!row.file_path;
    delete row.file_path;
    return row;
  });
}

/**
 * GET /api/admin/invoices
 * Query: page, limit, status, client_id, order_id, from, to,
 *        search (invoice # / order # / client name / email)
 */
exports.listInvoices = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = buildInvoiceQuery(req.query);

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
        { invoice_number: { $regex: search, $options: 'i' } },
        { transaction_id: { $regex: search, $options: 'i' } },
        { client_id: { $in: matchingClients.map(c => Number(c._id)) } },
        { order_id: { $in: matchingOrders.map(o => Number(o._id)) } }
      ];
    }

    const [total, invoices] = await Promise.all([
      Invoice.countDocuments(query),
      Invoice.find(query).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit)
    ]);

    res.json({
      invoices: await decorateInvoices(invoices),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (err) {
    console.error('admin listInvoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id)
      .populate('order_id', 'order_number state')
      .populate('client_id', 'first_name last_name email phone company_name');
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const row = toRow(inv);
    row.order_number = inv.order_id ? inv.order_id.order_number : null;
    row.order_id = inv.order_id ? inv.order_id.id : null;
    row.client_name = inv.client_id ? `${inv.client_id.first_name} ${inv.client_id.last_name}` : null;
    row.client_email = inv.client_id ? inv.client_id.email : null;
    row.client_id = inv.client_id ? inv.client_id.id : null;
    row.has_pdf = !!row.file_path;
    delete row.file_path;

    res.json({ invoice: row });
  } catch (err) {
    console.error('admin getInvoice error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

/**
 * GET /api/admin/invoices/:id/download[?inline=1]
 * Admins may download any invoice; missing files are regenerated on demand.
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const { filePath, fileName } = await invoiceService.ensureInvoiceFile(inv._id);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Invoice file unavailable' });

    const inline = req.query.inline === '1' || req.query.disposition === 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('admin downloadInvoice error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to download invoice' });
  }
};
