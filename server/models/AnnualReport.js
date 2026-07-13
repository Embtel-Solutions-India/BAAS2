const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const annualReportSchema = new mongoose.Schema({
  company_id:  { type: Number, ref: 'Company', required: true },
  state:       { type: String, required: true, minlength: 2, maxlength: 2 },
  due_date:    { type: Date, default: null },
  filed_date:  { type: Date, default: null },
  status:      { type: String, enum: ['pending','filed','overdue'], default: 'pending' },
  document_id: { type: Number, ref: 'Document', default: null }
}, schemaOptions);

annualReportSchema.plugin(autoIncrement, { modelName: 'AnnualReport' });

module.exports = mongoose.model('AnnualReport', annualReportSchema);
