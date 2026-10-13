import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register.bind(authController));
router.post('/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp.bind(authController));
router.post('/resend-otp', authRateLimiter, validate(resendOtpSchema), authController.resendOtp.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/verify-email/:token', authController.verifyEmail.bind(authController));
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
