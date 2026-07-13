const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/messageController');

router.use(requireAuth);

router.get ('/order/:orderId',  ctrl.getMessages);
router.post('/order/:orderId',  ctrl.sendMessage);
router.patch('/:id/read',       ctrl.markRead);

module.exports = router;
