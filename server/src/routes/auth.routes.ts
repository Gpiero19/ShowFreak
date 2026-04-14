import { Router, Request, Response } from 'express'
import { authController } from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authController.me)

export default router
