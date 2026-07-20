const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const ctrl        = require('../controllers/adminInvoiceController');

router.use(requireAuth, requireRole('admin', 'staff'));

router.get('/',             ctrl.listInvoices);
router.get('/:id/download', ctrl.downloadInvoice);
router.get('/:id',          ctrl.getInvoice);

module.exports = router;
