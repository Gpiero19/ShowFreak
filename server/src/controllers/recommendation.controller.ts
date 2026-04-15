import { Request, Response } from 'express'
import { recommendationService } from '../services/recommendation.service.js'

export const recommendationController = {
  async getRecommendations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      const result = await recommendationService.getRecommendations(userId, page, limit)

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      console.error('Recommendations error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async getSimilarTo(req: Request, res: Response) {
    try {
      const { id } = req.params
      const type = (req.query.type as string) || 'movie'
      const page = parseInt(req.query.page as string) || 1

      const result = await recommendationService.getSimilarTo(id, type, page)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Similar to error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}
