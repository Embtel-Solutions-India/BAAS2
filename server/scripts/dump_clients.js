const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/baas_portal');
    const docs = await mongoose.connection.db.collection('clients').find().toArray();
    console.log('Raw Clients:');
    console.log(JSON.stringify(docs, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
