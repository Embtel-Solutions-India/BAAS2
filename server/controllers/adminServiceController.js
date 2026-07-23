const path = require('path');
const { Service, Order, toRow } = require('../models');
const { uploadToS3 } = require('../config/s3');

/* ── helpers ── */

function slugify(text) {
  return String(text || '').toLowerCase().trim()
    .replace(/&/g, '-and-')
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base || 'service';
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = { slug };
    if (excludeId != null) q._id = { $ne: excludeId };
    const clash = await Service.findOne(q);
    if (!clash) return slug;
    slug = `${base}-${n++}`;
  }
}

// Multipart fields arrive as strings; accept JSON array, or newline/comma list.
function parseList(val) {
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
  if (val == null || val === '') return [];
  const s = String(val).trim();
  if (s.startsWith('[')) {
    try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map(v => String(v).trim()).filter(Boolean); } catch { /* fall through */ }
  }
  return s.split(/\r?\n|,/).map(v => v.trim()).filter(Boolean);
}

const num = (v, def = null) => {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function adminRow(svc) {
  const row = toRow(svc);
  delete row.__v;
  return row;
}

/* ── stats (for dashboard + module header) ── */
exports.getStats = async (req, res) => {
  try {
    const [total, available, unavailable] = await Promise.all([
      Service.countDocuments({ deleted_at: null }),
      Service.countDocuments({ deleted_at: null, is_active: true }),
      Service.countDocuments({ deleted_at: null, is_active: false }),
    ]);
    res.json({ total, available, unavailable });
  } catch (err) {
    console.error('admin service getStats error:', err);
    res.status(500).json({ error: 'Failed to fetch product stats' });
  }
};

/* ── list ── */
exports.listServices = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = { deleted_at: null };

    if (req.query.status === 'available') query.is_active = true;
    else if (req.query.status === 'unavailable') query.is_active = false;
    if (req.query.category && req.query.category !== 'all') query.category = req.query.category;

    const search = (req.query.search || '').trim();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { short_description: { $regex: search, $options: 'i' } },
      ];
    }

    const [total, services, stats] = await Promise.all([
      Service.countDocuments(query),
      Service.find(query).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit),
      Promise.all([
        Service.countDocuments({ deleted_at: null }),
        Service.countDocuments({ deleted_at: null, is_active: true }),
        Service.countDocuments({ deleted_at: null, is_active: false }),
      ]),
    ]);

    res.json({
      services: services.map(adminRow),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      stats: { total: stats[0], available: stats[1], unavailable: stats[2] },
    });
  } catch (err) {
    console.error('admin listServices error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

/* ── view ── */
exports.getService = async (req, res) => {
  try {
    const svc = await Service.findById(req.params.id);
    if (!svc) return res.status(404).json({ error: 'Product not found' });
    const row = adminRow(svc);
    row.order_count = await Order.countDocuments({ service_id: svc._id });
    res.json({ service: row });
  } catch (err) {
    console.error('admin getService error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

/* ── create ── */
exports.createService = async (req, res) => {
  try {
    const b = req.body;
    const name = String(b.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Product/service name is required' });

    const price = num(b.price, 0);
    if (price == null || price < 0) return res.status(400).json({ error: 'A valid price is required' });
    const discount = num(b.discount_price, null);
    if (discount != null && (discount < 0 || discount > price))
      return res.status(400).json({ error: 'Discount price must be between 0 and the price' });

    let thumbnail = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      thumbnail = await uploadToS3(req.file.buffer, 'services/thumbnails', req.file.mimetype, ext);
    }

    const slug = await uniqueSlug(slugify(name));
    const shortDesc = (b.short_description || b.description || '').trim() || null;

    const svc = await Service.create({
      name,
      slug,
      category: (b.category || 'General').trim(),
      description: shortDesc,                       // keep legacy field populated (order/list displays use it)
      short_description: shortDesc,
      full_description: (b.full_description || '').trim() || null,
      price,
      discount_price: discount,
      state_fee: num(b.state_fee, 0),
      turnaround_days: num(b.turnaround_days, 5),
      duration: (b.duration || '').trim() || null,
      features: parseList(b.features),
      benefits: parseList(b.benefits),
      thumbnail,
      meta_title: (b.meta_title || '').trim() || null,
      meta_description: (b.meta_description || '').trim() || null,
      is_active: b.is_active === undefined ? true : (b.is_active === 'true' || b.is_active === true),
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ message: 'Product created', service: adminRow(svc) });
  } catch (err) {
    console.error('createService error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

/* ── update ── */
exports.updateService = async (req, res) => {
  try {
    const svc = await Service.findById(req.params.id);
    if (!svc) return res.status(404).json({ error: 'Product not found' });

    const b = req.body;
    if (b.name !== undefined) {
      const name = String(b.name).trim();
      if (!name) return res.status(400).json({ error: 'Name cannot be empty' });
      if (name !== svc.name) { svc.name = name; svc.slug = await uniqueSlug(slugify(name), svc._id); }
    }
    if (b.price !== undefined) {
      const price = num(b.price, null);
      if (price == null || price < 0) return res.status(400).json({ error: 'A valid price is required' });
      svc.price = price;
    }
    if (b.discount_price !== undefined) {
      const d = num(b.discount_price, null);
      if (d != null && (d < 0 || d > svc.price)) return res.status(400).json({ error: 'Discount price must be between 0 and the price' });
      svc.discount_price = d;
    }
    if (b.category !== undefined) svc.category = (b.category || 'General').trim();
    if (b.short_description !== undefined || b.description !== undefined) {
      const sd = (b.short_description ?? b.description ?? '').trim() || null;
      svc.short_description = sd;
      svc.description = sd;                          // keep legacy field in sync
    }
    if (b.full_description !== undefined) svc.full_description = (b.full_description || '').trim() || null;
    if (b.state_fee !== undefined) svc.state_fee = num(b.state_fee, 0);
    if (b.turnaround_days !== undefined) svc.turnaround_days = num(b.turnaround_days, 5);
    if (b.duration !== undefined) svc.duration = (b.duration || '').trim() || null;
    if (b.features !== undefined) svc.features = parseList(b.features);
    if (b.benefits !== undefined) svc.benefits = parseList(b.benefits);
    if (b.meta_title !== undefined) svc.meta_title = (b.meta_title || '').trim() || null;
    if (b.meta_description !== undefined) svc.meta_description = (b.meta_description || '').trim() || null;
    if (b.is_active !== undefined) svc.is_active = (b.is_active === 'true' || b.is_active === true);

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      svc.thumbnail = await uploadToS3(req.file.buffer, 'services/thumbnails', req.file.mimetype, ext);
    }

    svc.updated_at = new Date();
    await svc.save();
    res.json({ message: 'Product updated', service: adminRow(svc) });
  } catch (err) {
    console.error('updateService error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

/* ── availability toggle ── */
exports.setAvailability = async (req, res) => {
  try {
    const svc = await Service.findById(req.params.id);
    if (!svc) return res.status(404).json({ error: 'Product not found' });
    svc.is_active = (req.body.is_active === true || req.body.is_active === 'true');
    svc.updated_at = new Date();
    await svc.save();
    res.json({ message: `Product marked ${svc.is_active ? 'Available' : 'Not Available'}`, service: adminRow(svc) });
  } catch (err) {
    console.error('setAvailability error:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

/* ── soft delete (always — keeps existing orders intact) ── */
exports.deleteService = async (req, res) => {
  try {
    const svc = await Service.findById(req.params.id);
    if (!svc) return res.status(404).json({ error: 'Product not found' });

    const orderCount = await Order.countDocuments({ service_id: svc._id });
    svc.deleted_at = new Date();
    svc.is_active = false;
    svc.updated_at = new Date();
    await svc.save();

    res.json({
      message: orderCount > 0
        ? `Product removed. ${orderCount} existing order(s) keep their records intact.`
        : 'Product removed.',
      order_count: orderCount,
    });
  } catch (err) {
    console.error('deleteService error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
