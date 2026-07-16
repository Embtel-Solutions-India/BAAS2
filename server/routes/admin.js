const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const ctrl        = require('../controllers/adminController');

router.use(requireAuth, requireRole('admin', 'staff'));

router.get ('/stats',                        ctrl.getDashboardStats);
router.get ('/analytics',                    ctrl.getAnalytics);

router.get ('/clients',                      ctrl.listClients);
router.get ('/clients/:id',                  ctrl.getClient);
router.patch('/clients/:id/status',          ctrl.toggleClientStatus);

router.get ('/orders',                       ctrl.listOrders);
router.get ('/orders/:id',                   ctrl.getOrder);
router.patch('/orders/:id/status',           ctrl.updateOrderStatus);
router.get ('/orders/:orderId/messages',     ctrl.getMessages);
router.post('/orders/:orderId/messages',     ctrl.sendMessage);

router.get ('/messages/order/:orderId',      ctrl.getMessages);
router.post('/messages/order/:orderId',      ctrl.sendMessage);

router.post('/notifications',                ctrl.createNotification);

router.get ('/activity',                     ctrl.getActivityLogs);

module.exports = router;
