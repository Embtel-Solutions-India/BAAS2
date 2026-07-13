const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const companyMemberSchema = new mongoose.Schema({
  company_id:    { type: Number, ref: 'Company', required: true },
  name:          { type: String, required: true },
  title:         { type: String, default: null },
  ownership_pct: { type: Number, default: null },
  email:         { type: String, default: null },
  phone:         { type: String, default: null },
  created_at:    { type: Date, default: Date.now }
}, schemaOptions);

companyMemberSchema.plugin(autoIncrement, { modelName: 'CompanyMember' });

module.exports = mongoose.model('CompanyMember', companyMemberSchema);
