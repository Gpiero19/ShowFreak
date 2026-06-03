import { Request, Response } from 'express'
import { recommendationService } from '../services/recommendation.service.js'
import { logger } from '../lib/logger.js'

export const recommendationController = {
  async getRecommendations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const basedOn = req.query.based_on as string | undefined

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        })
      }

      const result = await recommendationService.getRecommendations(userId, limit, basedOn)

      return res.json({
        success: true,
        data: {
          items: result.items,
          basedOn: result.basedOn,
        },
        pagination: result.pagination,
      })
    } catch (error: any) {
      logger.error({ err: error }, 'Recommendations error')
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded with TMDB',
          code: 'RATE_LIMIT_EXCEEDED',
        })
      }
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}
