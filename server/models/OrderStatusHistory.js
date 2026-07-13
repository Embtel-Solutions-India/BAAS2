const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const orderStatusHistorySchema = new mongoose.Schema({
  order_id:   { type: Number, ref: 'Order', required: true },
  status:     { type: String, required: true },
  changed_by: { type: String, default: null },
  note:       { type: String, default: null },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

orderStatusHistorySchema.plugin(autoIncrement, { modelName: 'OrderStatusHistory' });

module.exports = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
