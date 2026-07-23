const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/serviceController');

// Read-only catalog for authenticated clients (used by the New Order flow).
router.use(requireAuth);

router.get('/',    ctrl.listServices);
router.get('/:id', ctrl.getService);

module.exports = router;
