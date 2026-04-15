import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { recommendationController } from '../controllers/recommendation.controller.js'

const router = Router()

router.get('/', authMiddleware, recommendationController.getRecommendations)
router.get('/:id/similar', authMiddleware, recommendationController.getSimilarTo)

export default router
