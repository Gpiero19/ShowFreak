import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authController } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' },
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many accounts created from this IP. Try again in an hour.', code: 'RATE_LIMITED' },
})

router.post('/register', registerLimiter, authController.register)
router.post('/login', loginLimiter, authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', authMiddleware, authController.me)

export default router
