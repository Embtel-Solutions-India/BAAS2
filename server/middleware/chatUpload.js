const multer = require('multer');

// Allowed chat attachment MIME types (spec: images + office docs, ZIP optional).
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',                                                        // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   // .docx
  'application/vnd.ms-excel',                                                  // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',         // .xlsx
  'application/zip',                                                           // .zip (optional)
  'application/x-zip-compressed'
]);

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip'
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10) * 1024 * 1024;

function fileFilter(req, file, cb) {
  if (!file) return cb(null, true);
  if (!ALLOWED.has(file.mimetype)) {
    return cb(new Error('Unsupported file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, ZIP'), false);
  }
  cb(null, true);
}

const chatUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

module.exports = { chatUpload, ALLOWED, IMAGE_TYPES, EXT_BY_MIME, MAX_SIZE };
