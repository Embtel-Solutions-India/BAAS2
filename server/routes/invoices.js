const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/invoiceController');

router.use(requireAuth);

router.get('/',    ctrl.listInvoices);
router.get('/:id', ctrl.getInvoice);

module.exports = router;
