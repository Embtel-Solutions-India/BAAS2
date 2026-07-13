const router      = require('express').Router();
const { authLimiter } = require('../middleware/rateLimiter');
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/authController');

router.post('/register',        authLimiter, ctrl.register);
router.post('/login',           authLimiter, ctrl.login);
router.get ('/verify-email',                ctrl.verifyEmail);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, ctrl.resetPassword);
router.post('/logout',                      ctrl.logout);
router.get ('/me',              requireAuth, ctrl.me);

module.exports = router;
