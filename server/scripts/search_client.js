const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to test. Clients count:', await mongoose.connection.db.collection('clients').countDocuments());
    await mongoose.disconnect();

    await mongoose.connect('mongodb://localhost:27017/baas_portal');
    console.log('Connected to baas_portal. Clients count:', await mongoose.connection.db.collection('clients').countDocuments());
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
run();
