const mongoose = require('mongoose');
const autoIncrement = require('./autoIncrement');
const schemaOptions = require('./schemaOptions');

const registeredAgentSchema = new mongoose.Schema({
  company_id:    { type: Number, ref: 'Company', required: true },
  state:         { type: String, required: true, minlength: 2, maxlength: 2 },
  agent_name:    { type: String, default: null },
  agent_address: { type: String, default: null },
  renewal_date:  { type: Date, default: null },
  status:        { type: String, enum: ['active','expired','pending'], default: 'active' }
}, schemaOptions);

registeredAgentSchema.plugin(autoIncrement, { modelName: 'RegisteredAgent' });

module.exports = mongoose.model('RegisteredAgent', registeredAgentSchema);
