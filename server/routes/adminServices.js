const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const blogUpload  = require('../middleware/blogUpload');   // reuse: memory multer, 5MB, img-only
const ctrl        = require('../controllers/adminServiceController');

router.use(requireAuth, requireRole('admin', 'staff'));

// Wrap the thumbnail upload so a bad file returns a clean 400 (mirrors adminBlogs).
const withThumb = (req, res, next) => {
  blogUpload.single('thumbnail')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Image upload failed' });
    next();
  });
};

router.get   ('/',                    ctrl.listServices);
router.get   ('/stats',               ctrl.getStats);
router.get   ('/:id',                 ctrl.getService);
router.post  ('/',                    withThumb, ctrl.createService);
router.put   ('/:id',                 withThumb, ctrl.updateService);
router.patch ('/:id/availability',    ctrl.setAvailability);
router.delete('/:id',                 ctrl.deleteService);

module.exports = router;
