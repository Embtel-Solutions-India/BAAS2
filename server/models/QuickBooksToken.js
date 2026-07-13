const mongoose = require('mongoose');
const schemaOptions = require('./schemaOptions');

/**
 * Stores the QuickBooks OAuth 2.0 connection for the company.
 * A single document (keyed by realm_id) is kept and refreshed in place.
 * Token values are encrypted at rest (AES-256-GCM) by services/quickbooks.js.
 */
const quickBooksTokenSchema = new mongoose.Schema({
  realm_id:           { type: String, required: true, unique: true },
  environment:        { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
  access_token_enc:   { type: String, required: true },
  refresh_token_enc:  { type: String, required: true },
  access_expires_at:  { type: Date, required: true },
  refresh_expires_at: { type: Date, required: true },
  connected_by:       { type: Number, ref: 'Admin', default: null },
  created_at:         { type: Date, default: Date.now },
  updated_at:         { type: Date, default: Date.now }
}, schemaOptions);

module.exports = mongoose.model('QuickBooksToken', quickBooksTokenSchema);
