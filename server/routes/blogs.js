const router = require('express').Router();
const ctrl   = require('../controllers/blogController');

router.get('/',          ctrl.getPublishedBlogs);
router.get('/featured',  ctrl.getFeaturedBlogs);
router.get('/latest',    ctrl.getLatestBlogs);
router.get('/:slug',     ctrl.getBlogBySlug);

module.exports = router;
