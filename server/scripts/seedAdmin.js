const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

const DEFAULT_ADMIN = {
  name:  'BAAS Admin',
  email: 'admin@baas.com',
  role:  'admin',
  is_active: true
};
const DEFAULT_PASSWORD = 'AdminBaas@123';

async function seedDefaultAdmin() {
  try {
    const existing = await Admin.findOne({ email: DEFAULT_ADMIN.email });
    if (existing) {
      return; // Already exists, skip silently
    }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    const admin = new Admin({
      ...DEFAULT_ADMIN,
      password_hash: hash
    });
    await admin.save();
    console.log(`✅ Default admin seeded: ${DEFAULT_ADMIN.email}`);
  } catch (err) {
    console.error('⚠️  Admin seed error:', err.message);
  }
}

// Auto-run when required
seedDefaultAdmin();

module.exports = seedDefaultAdmin;
