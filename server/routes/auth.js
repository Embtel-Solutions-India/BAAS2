const router      = require('express').Router();
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const requireAuth = require('../middleware/auth');
const ctrl        = require('../controllers/authController');
const otpCtrl     = require('../controllers/otpAuthController');
const oauthCtrl   = require('../controllers/oauthController');

router.post('/register',        authLimiter, ctrl.register);
router.post('/login',           authLimiter, ctrl.login);
router.get ('/verify-email',                ctrl.verifyEmail);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, ctrl.resetPassword);
router.post('/logout',                      ctrl.logout);
router.get ('/me',              requireAuth, ctrl.me);

// ── Additive: passwordless client OTP login ──
router.post('/otp/send',    otpLimiter, otpCtrl.sendOtp);
router.post('/otp/resend',  otpLimiter, otpCtrl.resendOtp);
router.post('/otp/verify',  otpLimiter, otpCtrl.verifyOtp);

// ── Additive: mandatory email OTP verification for NEW registration ──
router.post('/register/send-otp',   otpLimiter, otpCtrl.registerSendOtp);
router.post('/register/resend-otp', otpLimiter, otpCtrl.registerResendOtp);
router.post('/register/verify',     otpLimiter, otpCtrl.registerVerify);

// ── Additive: client OAuth (gated on provider env credentials) ──
router.get('/methods',                       oauthCtrl.methods);
router.get('/oauth/:provider',               oauthCtrl.start);
router.get('/oauth/:provider/callback',      oauthCtrl.callback);

module.exports = router;
