const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET = process.env.AWS_BUCKET_NAME || '';

/**
 * Upload a file buffer to S3.
 * @param {Buffer} buffer   File data
 * @param {string} folder   S3 folder path (e.g. 'blogs/thumbnails')
 * @param {string} mimeType e.g. 'image/jpeg'
 * @param {string} ext      e.g. '.jpg'
 * @returns {Promise<string>} Public S3 URL
 */
async function uploadToS3(buffer, folder, mimeType, ext) {
  const key = `${folder}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType
  });

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await s3Client.send(command);
      return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } catch (err) {
      lastErr = err;
      console.error(`S3 upload attempt ${attempt} failed:`, err.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error(`S3 upload failed after 3 attempts: ${lastErr.message}`);
}

/**
 * Delete an object from S3 by its full URL or key.
 * @param {string} urlOrKey Full S3 URL or just the key
 */
async function deleteFromS3(urlOrKey) {
  if (!urlOrKey) return;

  let key = urlOrKey;
  // Extract key from full URL if needed
  if (urlOrKey.startsWith('http')) {
    try {
      const url = new URL(urlOrKey);
      key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    } catch {
      return; // Invalid URL, skip silently
    }
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key:    key
    });
    await s3Client.send(command);
  } catch (err) {
    console.error('S3 delete error:', err.message);
    // Non-critical — don't throw
  }
}

module.exports = { uploadToS3, deleteFromS3 };
