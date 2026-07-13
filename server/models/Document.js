const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const documentSchema = new mongoose.Schema({
  client_id:   { type: Number, ref: 'Client', required: true },
  order_id:    { type: Number, ref: 'Order', default: null },
  name:        { type: String, required: true },
  type:        { type: String, enum: ['articles','operating_agreement','ein_letter','certificate','annual_report','tax','invoice','receipt','license','other'], default: 'other' },
  file_path:   { type: String, required: true },
  file_size:   { type: Number, default: null },
  uploaded_by: { type: String, default: null },
  is_final:    { type: Boolean, default: false },
  created_at:  { type: Date, default: Date.now }
}, schemaOptions);

documentSchema.plugin(autoIncrement, { modelName: 'Document' });

module.exports = mongoose.model('Document', documentSchema);
