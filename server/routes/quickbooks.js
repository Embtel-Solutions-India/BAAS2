const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const ctrl        = require('../controllers/quickbooksController');

// Public routes (OAuth callback + webhook — no auth)
router.get ('/callback', ctrl.callback);
router.post('/webhook',  ctrl.webhook);

// Admin-only routes
router.get   ('/connect',     requireAuth, requireRole('admin'), ctrl.connect);
router.get   ('/status',      requireAuth, requireRole('admin', 'staff'), ctrl.status);
router.post  ('/disconnect',  requireAuth, requireRole('admin'), ctrl.disconnect);

module.exports = router;
