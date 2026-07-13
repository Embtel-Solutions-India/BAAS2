require('dotenv').config();
const mongoose = require('mongoose');

async function listDbs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baas_portal');
    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const dbs = await admin.listDatabases();
    console.log('--- Databases ---');
    console.log(JSON.stringify(dbs, null, 2));

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('--- Collections in current DB ---');
    console.log(collections.map(c => c.name));

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
listDbs();
