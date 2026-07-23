const { Service } = require('../models');

/**
 * One-time, idempotent cleanup that retires the old seeded services so the
 * catalog is fully admin-managed. Seeded rows have no `created_by`; admin-created
 * products always set it — so retiring `created_by: null` rows targets exactly the
 * legacy seeds and never an admin's product.
 *
 * We SOFT-delete (set deleted_at + is_active:false) instead of removing rows, so
 * existing orders that reference these services still resolve their names. After
 * the first run the rows already have deleted_at, so this is a no-op thereafter.
 */
async function retireSeededServices() {
  try {
    const res = await Service.updateMany(
      { created_by: null, deleted_at: null },
      { $set: { deleted_at: new Date(), is_active: false, updated_at: new Date() } }
    );
    const n = res.modifiedCount || res.nModified || 0;
    if (n) console.log(`✅ Retired ${n} legacy seeded service(s) — catalog is now admin-managed.`);
  } catch (err) {
    console.error('⚠️  retireSeededServices error:', err.message);
  }
}

// Auto-run on require (mirrors the previous seed script's pattern).
retireSeededServices();

module.exports = retireSeededServices;
