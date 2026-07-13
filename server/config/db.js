const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baas_portal';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.warn('⚠️  MongoDB not available:', err.message);
    console.warn('   Fill in MONGODB_URI in .env and restart to enable DB features.');
  });

module.exports = mongoose.connection;
