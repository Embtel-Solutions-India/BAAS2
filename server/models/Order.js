const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const orderSchema = new mongoose.Schema({
  client_id:    { type: Number, ref: 'Client', required: true },
  company_id:   { type: Number, ref: 'Company', default: null },
  service_id:   { type: Number, ref: 'Service', required: true },
  order_number: { type: String, required: true, unique: true },
  status:       { type: String, enum: ['pending','in_review','processing','submitted','approved','completed','cancelled'], default: 'pending' },
  state:        { type: String, required: true, minlength: 2, maxlength: 2 },
  notes:        { type: String, default: null },
  total_amount: { type: Number, default: 0.00 },
  currency:       { type: String, default: 'USD' },
  payment_status: { type: String, enum: ['unpaid','pending','processing','paid','failed','refunded','cancelled'], default: 'unpaid' },
  transaction_id: { type: String, default: null },
  qb_payment_id:  { type: String, default: null },
  created_at:   { type: Date, default: Date.now },
  updated_at:   { type: Date, default: Date.now }
}, schemaOptions);

orderSchema.plugin(autoIncrement, { modelName: 'Order' });

module.exports = mongoose.model('Order', orderSchema);
