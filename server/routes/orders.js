const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/orderController');

router.use(requireAuth);

router.get ('/',             ctrl.listOrders);
router.post('/',             ctrl.createOrder);
router.get ('/:id',          ctrl.getOrder);
router.patch('/:id/cancel',  ctrl.cancelOrder);

module.exports = router;
