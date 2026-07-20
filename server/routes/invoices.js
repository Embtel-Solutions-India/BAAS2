const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/invoiceController');

router.use(requireAuth);

router.get('/',                 ctrl.listInvoices);
router.get('/order/:orderId',   ctrl.getInvoiceByOrder);
router.get('/:id/download',     ctrl.downloadInvoice);
router.get('/:id',              ctrl.getInvoice);

module.exports = router;
