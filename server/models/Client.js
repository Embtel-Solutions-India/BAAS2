const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const clientSchema = new mongoose.Schema({
  first_name:    { type: String, required: true, trim: true },
  last_name:     { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  phone:         { type: String, default: null },
  company_name:  { type: String, default: null, trim: true },
  is_verified:   { type: Boolean, default: false },
  is_active:     { type: Boolean, default: true },
  created_at:    { type: Date, default: Date.now }
}, schemaOptions);

clientSchema.plugin(autoIncrement, { modelName: 'Client' });

module.exports = mongoose.model('Client', clientSchema);
