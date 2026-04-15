import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { libraryController } from '../controllers/library.controller.js'

const router = Router()

router.get('/', authMiddleware, libraryController.getAll)
router.post('/', authMiddleware, libraryController.create)
router.patch('/:id', authMiddleware, libraryController.update)
router.delete('/:id', authMiddleware, libraryController.delete)

export default router
