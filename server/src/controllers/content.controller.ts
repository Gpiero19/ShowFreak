import { Request, Response } from 'express'
import { contentService } from '../services/content.service.js'

export const contentController = {
  async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string || req.query.query as string
      const type = (req.query.type as string) || 'movie'
      const page = parseInt(req.query.page as string) || 1

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter required',
          code: 'MISSING_QUERY',
        })
      }

      const result = await contentService.search(query, type, page)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Content search error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async getDetails(req: Request, res: Response) {
    try {
      const { id } = req.params
      const type = (req.query.type as string) || 'movie'

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Content ID required',
          code: 'MISSING_ID',
        })
      }

      const result = await contentService.getDetails(id, type)

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Content not found',
          code: 'NOT_FOUND',
        })
      }

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Content details error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async getSimilar(req: Request, res: Response) {
    try {
      const { id } = req.params
      const type = (req.query.type as string) || 'movie'

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Content ID required',
          code: 'MISSING_ID',
        })
      }

      const result = await contentService.getSimilar(id, type)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Content similar error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}
