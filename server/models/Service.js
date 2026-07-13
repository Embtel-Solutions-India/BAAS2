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
  is_active:       { type: Boolean, default: true }
}, schemaOptions);

serviceSchema.plugin(autoIncrement, { modelName: 'Service' });

module.exports = mongoose.model('Service', serviceSchema);
