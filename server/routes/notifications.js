const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/notificationController');

router.use(requireAuth);

router.get  ('/',          ctrl.listNotifications);
router.patch('/read-all',  ctrl.markAllRead);
router.patch('/:id/read',  ctrl.markRead);

module.exports = router;
