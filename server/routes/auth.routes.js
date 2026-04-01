const { Router } = require('express');
const { signup, login, forgotPassword, resetPassword, getMe } = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/signup',          authLimiter, signup);
router.post('/login',           authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.get('/me', authenticate, getMe);

module.exports = router;
