require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  Admin,
  Client,
  Company,
  CompanyMember,
  Service,
  Order,
  OrderStatusHistory,
  Document,
  Message,
  Notification,
  Invoice,
  Payment,
  ActivityLog,
  RegisteredAgent,
  AnnualReport,
  BoiFiling,
  EmailVerification,
  PasswordReset
} = require('../models');
const Counter = require('../models/Counter');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baas_portal';

const servicesData = [
  { name: 'LLC Formation',          slug: 'llc-formation',         description: 'Form a Limited Liability Company in any US state. Includes name check, Articles of Organization, and filing.',                price: 299.00,  state_fee: 0.00, turnaround_days: 5 },
  { name: 'C-Corp Formation',       slug: 'ccorp-formation',        description: 'Incorporate a C-Corporation in any US state. Includes Articles of Incorporation and filing.',                               price: 399.00,  state_fee: 0.00, turnaround_days: 7 },
  { name: 'S-Corp Formation',       slug: 'scorp-formation',        description: 'Incorporate an S-Corporation with IRS S-election (Form 2553) filing included.',                                            price: 399.00,  state_fee: 0.00, turnaround_days: 7 },
  { name: 'DBA / Fictitious Name',  slug: 'dba-registration',       description: 'Register a Doing Business As (DBA) or fictitious business name in your state.',                                            price: 149.00,  state_fee: 0.00, turnaround_days: 3 },
  { name: 'EIN Application',        slug: 'ein-application',        description: 'Obtain a Federal Employer Identification Number (EIN) from the IRS. Same-day processing available.',                        price: 99.00,   state_fee: 0.00, turnaround_days: 2 },
  { name: 'Registered Agent',       slug: 'registered-agent',       description: 'Annual registered agent service in any US state. Stay compliant and never miss a legal notice.',                           price: 149.00,  state_fee: 0.00, turnaround_days: 1 },
  { name: 'Annual Report Filing',   slug: 'annual-report',          description: 'Prepare and file your required annual report with the state on time.',                                                      price: 149.00,  state_fee: 0.00, turnaround_days: 3 },
  { name: 'BOI Report Filing',      slug: 'boi-report',             description: 'FinCEN Beneficial Ownership Information (BOI) report filing under the Corporate Transparency Act.',                         price: 149.00,  state_fee: 0.00, turnaround_days: 3 },
  { name: 'Business License',       slug: 'business-license',       description: 'Research, obtain, and file required federal, state, and local business licenses and permits.',                              price: 199.00,  state_fee: 0.00, turnaround_days: 7 },
  { name: 'Operating Agreement',    slug: 'operating-agreement',    description: 'Draft a customized LLC Operating Agreement tailored to your business structure and ownership.',                              price: 249.00,  state_fee: 0.00, turnaround_days: 5 },
  { name: 'Amendment Filing',       slug: 'amendment-filing',       description: 'File amendments to your existing business entity (name change, address update, ownership changes, etc.).',                  price: 199.00,  state_fee: 0.00, turnaround_days: 5 },
  { name: 'Dissolution Filing',     slug: 'dissolution-filing',     description: 'Formally dissolve your business entity with the state and close all obligations.',                                          price: 199.00,  state_fee: 0.00, turnaround_days: 5 },
  { name: 'S-Corp Election',        slug: 'scorp-election',         description: 'File IRS Form 2553 to elect S-Corporation tax status for an existing LLC or C-Corp.',                                      price: 149.00,  state_fee: 0.00, turnaround_days: 3 },
  { name: 'Foreign Qualification',  slug: 'foreign-qualification',  description: 'Register your existing business to operate legally in a new state (foreign qualification / certificate of authority).',     price: 299.00,  state_fee: 0.00, turnaround_days: 7 }
];

async function seed() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Cleaning database...');

    const models = [
      Counter, Admin, Client, Company, CompanyMember, Service, Order,
      OrderStatusHistory, Document, Message, Notification, Invoice,
      Payment, ActivityLog, RegisteredAgent, AnnualReport, BoiFiling,
      EmailVerification, PasswordReset
    ];

    for (const model of models) {
      await model.deleteMany({});
      console.log(`Cleared ${model.modelName} collection.`);
    }

    console.log('Seeding Default Admin...');
    const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
    const defaultAdmin = new Admin({
      name: 'BAAS Admin',
      email: 'admin@bayareaaccountingsolutions.com',
      password_hash: adminPasswordHash,
      role: 'admin',
      is_active: true
    });
    await defaultAdmin.save();
    console.log(`Admin seeded with ID: ${defaultAdmin._id}`);

    console.log('Seeding Services Catalog...');
    for (const service of servicesData) {
      const newService = new Service(service);
      await newService.save();
    }
    console.log(`Successfully seeded ${servicesData.length} services.`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
