import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { preferencesController } from '../controllers/preferences.controller.js'

const router = Router()

router.get('/', authMiddleware, preferencesController.getAll)
router.post('/', authMiddleware, preferencesController.create)
router.delete('/:id', authMiddleware, preferencesController.delete)

export default router
