const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/profileController');

router.use(requireAuth);

router.get ('/',               ctrl.getProfile);
router.put ('/',               ctrl.updateProfile);
router.post('/change-password', ctrl.changePassword);

module.exports = router;
