const { Service } = require('../models');
const Counter = require('../models/Counter');

// Catalog mirrors the client "New Order" service list (ids must match, since the
// order form posts these ids). Idempotent: only inserts services that are missing,
// so any later admin edits to prices/names are preserved.
const SERVICES = [
  { _id: 1,  name: 'LLC Registration',            slug: 'llc-registration',            description: 'Complete formation of a Limited Liability Company.', price: 199, state_fee: 100 },
  { _id: 2,  name: 'Corporation Formation',       slug: 'corporation-formation',       description: 'Incorporation of a C-Corp or S-Corp.',              price: 249, state_fee: 150 },
  { _id: 3,  name: 'Annual Report Filing',        slug: 'annual-report-filing',        description: 'State-required yearly compliance filing.',          price: 99,  state_fee: 50 },
  { _id: 4,  name: 'BOI Filing',                  slug: 'boi-filing',                  description: 'Beneficial Ownership Information report.',           price: 75,  state_fee: 0 },
  { _id: 5,  name: 'Registered Agent Service',    slug: 'registered-agent-service',    description: 'One year of registered agent representation.',       price: 150, state_fee: 0 },
  { _id: 6,  name: 'EIN (Tax ID) Acquisition',    slug: 'ein-tax-id-acquisition',      description: 'Obtaining employer identification number.',          price: 50,  state_fee: 0 },
  { _id: 7,  name: 'Operating Agreement Drafting', slug: 'operating-agreement-drafting', description: 'Custom corporate governing document.',              price: 120, state_fee: 0 },
  { _id: 8,  name: 'Bookkeeping Setup',           slug: 'bookkeeping-setup',           description: 'Initial accounting systems installation.',           price: 299, state_fee: 0 },
  { _id: 9,  name: 'Monthly Bookkeeping',         slug: 'monthly-bookkeeping',         description: 'Ongoing monthly accounts management.',               price: 199, state_fee: 0 },
  { _id: 10, name: 'Corporate Tax Return',        slug: 'corporate-tax-return',        description: 'Annual federal and state tax filing.',               price: 499, state_fee: 0 },
  { _id: 11, name: 'Sales Tax Registration',      slug: 'sales-tax-registration',      description: 'Sales and use tax permit acquisition.',              price: 99,  state_fee: 10 },
  { _id: 12, name: 'Payroll Setup',               slug: 'payroll-setup',               description: 'Employee payments processing deployment.',           price: 150, state_fee: 0 },
  { _id: 13, name: 'Tax Consultation',            slug: 'tax-consultation',            description: 'One hour advisory meeting with CPA.',                price: 150, state_fee: 0 },
  { _id: 14, name: 'Dissolution Filing',          slug: 'dissolution-filing',          description: 'Formal closure of business entity.',                 price: 175, state_fee: 60 },
];

async function seedServices() {
  try {
    let created = 0;
    for (const s of SERVICES) {
      const exists = await Service.findById(s._id);
      if (exists) continue;
      await Service.create({ ...s, is_active: true });
      created += 1;
    }
    // Keep the auto-increment counter ahead of the seeded ids so any future
    // auto-generated Service _id won't collide with these.
    const maxId = SERVICES.reduce((m, s) => Math.max(m, s._id), 0);
    await Counter.findByIdAndUpdate('Service', { $max: { seq: maxId } }, { upsert: true });
    if (created) console.log(`✅ Seeded ${created} service(s).`);
  } catch (err) {
    console.error('⚠️  Service seed error:', err.message);
  }
}

// Auto-run when required (mirrors seedAdmin).
seedServices();

module.exports = seedServices;
