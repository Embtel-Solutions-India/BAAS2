const router      = require('express').Router();
const multer      = require('multer');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const ctrl        = require('../controllers/chatController');
const { chatUpload } = require('../middleware/chatUpload');

router.use(requireAuth);

// Wrap multer so file-type/size errors become clean 400s instead of 500s.
function uploadSingle(field) {
  return (req, res, next) => chatUpload.single(field)(req, res, (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the 20 MB limit'
        : err.message;
      return res.status(400).json({ error: msg });
    }
    next();
  });
}

router.get  ('/conversation',                    ctrl.getMyConversation);          // client: own
router.get  ('/conversations',                   ctrl.listConversations);          // both
router.get  ('/conversations/:id/messages',      ctrl.getMessages);
router.post ('/conversations/:id/messages',      ctrl.sendMessage);
router.post ('/conversations/:id/attachments',   uploadSingle('file'), ctrl.uploadAttachment);
router.patch('/conversations/:id/read',          ctrl.markRead);
router.patch('/conversations/:id/status',        requireRole('admin', 'staff'), ctrl.setStatus);
router.get  ('/conversations/:id/presence',      ctrl.getPresence);

module.exports = router;
