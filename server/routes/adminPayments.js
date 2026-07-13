const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const ctrl        = require('../controllers/adminPaymentController');

router.use(requireAuth, requireRole('admin', 'staff'));

router.get   ('/',                 ctrl.listPayments);
router.get   ('/analytics',        ctrl.getAnalytics);
router.post  ('/:id/refund',       ctrl.refundPayment);
router.get   ('/export/payments',  ctrl.exportPayments);
router.get   ('/export/orders',    ctrl.exportOrders);

module.exports = router;
