const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const paymentSchema = new mongoose.Schema({
  invoice_id:     { type: Number, ref: 'Invoice', default: null },
  client_id:      { type: Number, ref: 'Client', required: true },
  amount:         { type: Number, required: true },
  method:         { type: String, default: null },
  transaction_id: { type: String, default: null },
  gateway:        { type: String, default: null },
  status:         { type: String, enum: ['pending','processing','completed','failed','refunded','cancelled'], default: 'pending' },
  order_id:        { type: Number, ref: 'Order', default: null },
  currency:        { type: String, default: 'USD' },
  qb_payment_id:   { type: String, default: null },
  card_last4:      { type: String, default: null },
  card_type:       { type: String, default: null },
  refunded_amount: { type: Number, default: 0 },
  refund_id:       { type: String, default: null },
  failure_reason:  { type: String, default: null },
  updated_at:      { type: Date, default: Date.now },
  created_at:     { type: Date, default: Date.now }
}, schemaOptions);

paymentSchema.index({ status: 1, created_at: -1 });
paymentSchema.index({ client_id: 1, created_at: -1 });

paymentSchema.plugin(autoIncrement, { modelName: 'Payment' });

module.exports = mongoose.model('Payment', paymentSchema);
