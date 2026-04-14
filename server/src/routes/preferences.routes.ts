import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', authMiddleware, (_req, _res) => {
  _res.json({ success: true, data: [] })
})

router.post('/', authMiddleware, (_req, _res) => {
  _res.status(201).json({ success: true, data: null })
})

router.delete('/:id', authMiddleware, (_req, _res) => {
  _res.status(204).json()
})

export default router
