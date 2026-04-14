import { Router } from 'express'

const router = Router()

router.get('/search', (_req, _res) => {
  _res.json({ success: true, data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } })
})

router.get('/:id', (_req, _res) => {
  _res.json({ success: true, data: null })
})

router.get('/:id/similar', (_req, _res) => {
  _res.json({ success: true, data: [] })
})

export default router
