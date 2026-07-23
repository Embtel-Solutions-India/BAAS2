const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const serviceSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  slug:            { type: String, required: true, unique: true },
  description:     { type: String, default: null },
  price:           { type: Number, default: 0.00 },
  state_fee:       { type: Number, default: 0.00 },
  turnaround_days: { type: Number, default: 5 },
  is_active:       { type: Boolean, default: true },
  // ── Additive: admin-managed product/service catalog fields ──
  category:          { type: String, default: 'General' },
  short_description: { type: String, default: null },
  full_description:  { type: String, default: null },
  discount_price:    { type: Number, default: null },
  thumbnail:         { type: String, default: null },
  images:            { type: [String], default: [] },
  features:          { type: [String], default: [] },
  benefits:          { type: [String], default: [] },
  duration:          { type: String, default: null },
  meta_title:        { type: String, default: null },
  meta_description:  { type: String, default: null },
  created_by:        { type: Number, ref: 'Admin', default: null },   // null = legacy/seeded
  deleted_at:        { type: Date, default: null },                   // soft delete (keeps orders intact)
  created_at:        { type: Date, default: Date.now },
  updated_at:        { type: Date, default: Date.now }
}, schemaOptions);

serviceSchema.index({ deleted_at: 1, is_active: 1 });

serviceSchema.plugin(autoIncrement, { modelName: 'Service' });

module.exports = mongoose.model('Service', serviceSchema);
