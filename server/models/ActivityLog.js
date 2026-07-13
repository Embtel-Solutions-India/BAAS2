const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const activityLogSchema = new mongoose.Schema({
  admin_id:    { type: Number, ref: 'Admin', default: null },
  action:      { type: String, required: true },
  entity_type: { type: String, default: null },
  entity_id:   { type: Number, default: null },
  meta:        { type: mongoose.Schema.Types.Mixed, default: null },
  created_at:  { type: Date, default: Date.now }
}, schemaOptions);

activityLogSchema.plugin(autoIncrement, { modelName: 'ActivityLog' });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
