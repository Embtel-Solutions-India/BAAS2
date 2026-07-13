const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const blogUpload  = require('../middleware/blogUpload');
const ctrl        = require('../controllers/blogController');

router.use(requireAuth, requireRole('admin', 'staff'));

// Helper to log and wrap file upload requests
const handleUpload = (fieldName) => {
  return (req, res, next) => {
    console.log(`[Upload] Incoming ${req.method} ${req.originalUrl} file upload request`);
    blogUpload.single(fieldName)(req, res, (err) => {
      if (err) {
        console.error('[Upload] Multer processing error:', err);
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      console.log('[Upload] Multer completed successfully. req.file:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file uploaded');
      next();
    });
  };
};

router.post('/',                   handleUpload('thumbnail'), ctrl.createBlog);
router.get ('/',                                              ctrl.listBlogs);
router.get ('/:id',                                           ctrl.getBlog);
router.put ('/:id',                handleUpload('thumbnail'), ctrl.updateBlog);
router.delete('/:id',                                         ctrl.deleteBlog);
router.patch('/:id/publish',                                  ctrl.publishBlog);
router.patch('/:id/unpublish',                                ctrl.unpublishBlog);

module.exports = router;
