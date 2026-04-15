import { Router } from 'express'
import { contentController } from '../controllers/content.controller.js'

const router = Router()

router.get('/search', contentController.search)
router.get('/:id', contentController.getDetails)
router.get('/:id/similar', contentController.getSimilar)

export default router
