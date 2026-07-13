const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const adminSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ['admin', 'staff'], default: 'staff' },
  is_active:     { type: Boolean, default: true },
  created_at:    { type: Date, default: Date.now }
}, schemaOptions);

adminSchema.plugin(autoIncrement, { modelName: 'Admin' });

module.exports = mongoose.model('Admin', adminSchema);
