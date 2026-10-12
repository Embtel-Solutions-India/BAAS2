const router = require('express').Router();
const { getFromS3 } = require('../config/s3');

// Public image proxy for blog/service thumbnails only. Streams from a private
// S3 bucket so images load without making the bucket publicly readable.
const ALLOWED = /^(blogs|services)\/thumbnails\/[A-Za-z0-9._-]+$/;

router.get(/^\/(.+)$/, async (req, res) => {
  const key = req.params[0];
  if (!ALLOWED.test(key)) return res.status(404).end();
  try {
    const obj = await getFromS3(key);
    res.set({
      'Content-Type': obj.ContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    if (obj.ContentLength) res.set('Content-Length', String(obj.ContentLength));
    obj.Body.pipe(res);
  } catch (err) {
    if (err.name !== 'NoSuchKey') console.error('[media] fetch failed:', err.message);
    res.status(404).end();
  }
});

module.exports = router;
