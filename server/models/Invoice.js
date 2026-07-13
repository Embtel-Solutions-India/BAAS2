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
  created_at:     { type: Date, default: Date.now }
}, schemaOptions);

invoiceSchema.plugin(autoIncrement, { modelName: 'Invoice' });

module.exports = mongoose.model('Invoice', invoiceSchema);
