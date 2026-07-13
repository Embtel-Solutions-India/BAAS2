require('dotenv').config();
const mongoose = require('mongoose');
const { Client, EmailVerification } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baas_portal';

async function verify() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const clients = await Client.find();
    console.log('--- Clients ---');
    console.log(JSON.stringify(clients, null, 2));

    const verifications = await EmailVerification.find();
    console.log('--- Email Verifications ---');
    console.log(JSON.stringify(verifications, null, 2));

    mongoose.disconnect();
  } catch (err) {
    console.error('Error verifying database:', err);
  }
}

verify();
