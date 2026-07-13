const router      = require('express').Router();
const requireAuth = require('../middleware/auth');
const upload      = require('../middleware/upload');
const ctrl        = require('../controllers/documentController');

router.use(requireAuth);

router.get ('/',                       ctrl.listDocuments);
router.get ('/order/:orderId',         ctrl.listOrderDocuments);
router.post('/upload/:orderId',        upload.single('file'), ctrl.uploadDocument);
router.get ('/:id/download',           ctrl.downloadDocument);
router.delete('/:id',                  ctrl.deleteDocument);

module.exports = router;
