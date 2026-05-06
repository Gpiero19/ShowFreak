import { Request, Response } from 'express'

export const preferencesController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id

      res.json({
        success: true,
        data: [],
      })
    } catch (error) {
      console.error('Preferences getAll error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const { externalId, contentType, dislikeReason } = req.body

      res.status(201).json({
        success: true,
        data: null,
      })
    } catch (error) {
      console.error('Preferences create error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const { id } = req.params

      res.status(204).json({
        success: true,
      })
    } catch (error) {
      console.error('Preferences delete error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}