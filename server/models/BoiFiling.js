const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const boiFilingSchema = new mongoose.Schema({
  company_id:  { type: Number, ref: 'Company', required: true },
  filing_date: { type: Date, default: null },
  status:      { type: String, enum: ['pending','submitted','accepted','rejected'], default: 'pending' },
  fincen_id:   { type: String, default: null },
  document_id: { type: Number, ref: 'Document', default: null }
}, schemaOptions);

boiFilingSchema.plugin(autoIncrement, { modelName: 'BoiFiling' });

module.exports = mongoose.model('BoiFiling', boiFilingSchema);
