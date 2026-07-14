const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

/**
 * A single real-time chat message inside a Conversation.
 * Text and/or a single attachment (stored on S3, only the URL is persisted).
 */
const chatMessageSchema = new mongoose.Schema({
  conversation_id: { type: Number, ref: 'Conversation', required: true, index: true },
  sender_id:       { type: Number, required: true },
  sender_role:     { type: String, enum: ['client', 'admin', 'staff'], required: true },
  receiver_id:     { type: Number, default: null },
  body:            { type: String, default: '' },
  attachment_url:  { type: String, default: null },
  attachment_type: { type: String, default: null },   // MIME type
  attachment_name: { type: String, default: null },
  attachment_size: { type: Number, default: null },    // bytes
  status:          { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  is_read:         { type: Boolean, default: false },
  created_at:      { type: Date, default: Date.now },
  updated_at:      { type: Date, default: Date.now }
}, schemaOptions);

chatMessageSchema.index({ conversation_id: 1, created_at: -1 });

chatMessageSchema.plugin(autoIncrement, { modelName: 'ChatMessage' });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
