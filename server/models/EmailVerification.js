const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const emailVerificationSchema = new mongoose.Schema({
  client_id:  { type: Number, ref: 'Client', required: true },
  token:      { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  used:       { type: Boolean, default: false }
}, schemaOptions);

emailVerificationSchema.plugin(autoIncrement, { modelName: 'EmailVerification' });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
