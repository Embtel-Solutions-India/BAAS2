const { Service, toRow } = require('../models');

// Public shape shown to clients — never leaks internal-only fields.
function publicRow(svc) {
  const row = toRow(svc);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.short_description || row.description || '',
    full_description: row.full_description || row.description || '',
    price: row.price,
    discount_price: row.discount_price,
    state_fee: row.state_fee,
    turnaround_days: row.turnaround_days,
    duration: row.duration,
    features: row.features || [],
    benefits: row.benefits || [],
    thumbnail: row.thumbnail,
    images: row.images || [],
  };
}

/** GET /api/services — active, non-deleted catalog only (what clients can buy). */
exports.listServices = async (req, res) => {
  try {
    const services = await Service.find({ is_active: true, deleted_at: null })
      .sort({ created_at: -1 });
    res.json({ services: services.map(publicRow) });
  } catch (err) {
    console.error('listServices error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

/** GET /api/services/:id — single available service (View Details). */
exports.getService = async (req, res) => {
  try {
    const svc = await Service.findOne({ _id: req.params.id, is_active: true, deleted_at: null });
    if (!svc) return res.status(404).json({ error: 'Service not available' });
    res.json({ service: publicRow(svc) });
  } catch (err) {
    console.error('getService error:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};
