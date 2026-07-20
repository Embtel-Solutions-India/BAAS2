const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const invoiceSchema = new mongoose.Schema({
  client_id:      { type: Number, ref: 'Client', required: true },
  order_id:       { type: Number, ref: 'Order', default: null },
  invoice_number: { type: String, required: true, unique: true },
  subtotal:       { type: Number, default: 0.00 },
  tax:            { type: Number, default: 0.00 },
  total:          { type: Number, default: 0.00 },
  status:         { type: String, enum: ['draft','sent','paid','overdue','cancelled'], default: 'draft' },
  due_date:       { type: Date, default: null },
  paid_at:        { type: Date, default: null },
  // ── Additive: persistent PDF + payment snapshot (see invoiceService) ──
  discount:         { type: Number, default: 0.00 },
  currency:         { type: String, default: 'USD' },
  service_name:     { type: String, default: null },   // snapshot of the service at purchase time
  payment_method:   { type: String, default: null },   // e.g. 'card'
  transaction_id:   { type: String, default: null },   // gateway/charge id
  file_path:        { type: String, default: null },   // local path to the stored PDF (server-only)
  pdf_generated_at: { type: Date,   default: null },
  created_at:     { type: Date, default: Date.now }
}, schemaOptions);

invoiceSchema.plugin(autoIncrement, { modelName: 'Invoice' });

module.exports = mongoose.model('Invoice', invoiceSchema);
