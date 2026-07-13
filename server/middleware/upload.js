const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '20') * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(
      __dirname, '..', 'uploads',
      String(req.user.id),
      String(req.params.orderId || 'general')
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_\-]/gi, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if (!file) {
    return cb(null, true);
  }
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only PDF, JPG, PNG and DOCX files are allowed'), false);
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = upload;
