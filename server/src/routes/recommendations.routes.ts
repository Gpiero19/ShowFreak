import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', authMiddleware, (_req, _res) => {
  _res.json({ success: true, data: { items: [], basedOn: 'genre_preference' } })
})

export default router
