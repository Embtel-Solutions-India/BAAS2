const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const notificationSchema = new mongoose.Schema({
  client_id:  { type: Number, ref: 'Client', required: true },
  type:       { type: String, default: 'general' },
  title:      { type: String, required: true },
  body:       { type: String, required: true },
  is_read:    { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

notificationSchema.plugin(autoIncrement, { modelName: 'Notification' });

module.exports = mongoose.model('Notification', notificationSchema);
