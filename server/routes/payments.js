const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/paymentController');
const checkout    = require('../controllers/checkoutController');

router.use(requireAuth);

router.post('/intent',                    ctrl.createIntent);
router.get ('/',                          ctrl.listPayments);
router.post('/quickbooks/charge',         checkout.chargeOrder);
router.get ('/:id/receipt',               checkout.getReceipt);

module.exports = router;
