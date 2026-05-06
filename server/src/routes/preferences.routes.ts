import { Router } from 'express'
import { preferencesController } from '../controllers/preferences.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', authMiddleware, preferencesController.getAll)
router.post('/', authMiddleware, preferencesController.create)
router.delete('/:id', authMiddleware, preferencesController.delete)

export default router
