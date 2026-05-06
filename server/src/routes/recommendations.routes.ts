import { Router } from 'express'
import { recommendationController } from '../controllers/recommendation.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', authMiddleware, recommendationController.getRecommendations)

export default router
