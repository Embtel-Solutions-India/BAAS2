const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const passwordResetSchema = new mongoose.Schema({
  client_id:  { type: Number, ref: 'Client', required: true },
  token:      { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  used:       { type: Boolean, default: false }
}, schemaOptions);

passwordResetSchema.plugin(autoIncrement, { modelName: 'PasswordReset' });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
