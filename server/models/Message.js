const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const messageSchema = new mongoose.Schema({
  order_id:        { type: Number, ref: 'Order', required: true },
  sender_id:       { type: Number, required: true },
  sender_role:     { type: String, enum: ['client','admin','staff'], required: true },
  body:            { type: String, required: true },
  attachment_path: { type: String, default: null },
  is_read:         { type: Boolean, default: false },
  created_at:      { type: Date, default: Date.now }
}, schemaOptions);

messageSchema.plugin(autoIncrement, { modelName: 'Message' });

module.exports = mongoose.model('Message', messageSchema);
