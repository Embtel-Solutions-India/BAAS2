const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

/**
 * A support conversation between one client and the admin team.
 * Exactly one open conversation per client (enforced in the service layer).
 * Fully separate from the order-scoped `Message` model.
 */
const conversationSchema = new mongoose.Schema({
  client_id:        { type: Number, ref: 'Client', required: true, index: true },
  admin_id:         { type: Number, ref: 'Admin', default: null },
  last_message:     { type: String, default: '' },
  last_message_at:  { type: Date, default: null },
  last_sender_role: { type: String, enum: ['client', 'admin', 'staff', null], default: null },
  client_unread:    { type: Number, default: 0 },
  admin_unread:     { type: Number, default: 0 },
  status:           { type: String, enum: ['open', 'resolved', 'archived'], default: 'open' },
  // Email-notification cooldown tracking (additive)
  last_notified_client_at: { type: Date, default: null },
  last_notified_admin_at:  { type: Date, default: null },
  created_at:       { type: Date, default: Date.now },
  updated_at:       { type: Date, default: Date.now }
}, schemaOptions);

conversationSchema.index({ status: 1, last_message_at: -1 });

conversationSchema.plugin(autoIncrement, { modelName: 'Conversation' });

module.exports = mongoose.model('Conversation', conversationSchema);
