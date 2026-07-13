const multer = require('multer');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!file) {
    return cb(null, true);
  }
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
  }
  cb(null, true);
}

const blogUpload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = blogUpload;
