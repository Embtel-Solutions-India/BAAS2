const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const companySchema = new mongoose.Schema({
  client_id:      { type: Number, ref: 'Client', required: true },
  legal_name:     { type: String, required: true },
  entity_type:    { type: String, enum: ['LLC','C-Corp','S-Corp','Sole Proprietorship','Partnership','Non-Profit'], required: true },
  state:          { type: String, required: true, minlength: 2, maxlength: 2 },
  ein:            { type: String, default: null },
  formation_date: { type: Date, default: null },
  status:         { type: String, enum: ['active','inactive','dissolved','pending'], default: 'pending' },
  created_at:     { type: Date, default: Date.now }
}, schemaOptions);

companySchema.plugin(autoIncrement, { modelName: 'Company' });

module.exports = mongoose.model('Company', companySchema);
