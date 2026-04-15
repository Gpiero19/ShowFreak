import { Request, Response } from 'express'
import { libraryService } from '../services/library.service.js'

export const libraryController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const { status, type, q, genre, sort, order, page, limit } = req.query

      const result = await libraryService.getItems({
        userId,
        status: status as string,
        contentType: type as string,
        search: q as string,
        genre: genre as string,
        sortBy: sort as string || 'createdAt',
        sortOrder: order as 'asc' | 'desc' || 'desc',
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      })

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      console.error('Library get error:', error)
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
      const { externalId, contentType, status, personalRating, notes, watchedAt } = req.body

      if (!externalId || !contentType || !status) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
        })
      }

      const item = await libraryService.createItem(userId, {
        externalId,
        contentType,
        status,
        personalRating,
        notes,
        watchedAt: watchedAt ? new Date(watchedAt) : undefined,
      })

      res.status(201).json({
        success: true,
        data: item,
      })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'Item already in library',
          code: 'DUPLICATE_ITEM',
        })
      }
      console.error('Library create error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const { id } = req.params
      const { status, personalRating, notes, watchedAt } = req.body

      const item = await libraryService.updateItem(id, userId, {
        status,
        personalRating,
        notes,
        watchedAt: watchedAt ? new Date(watchedAt) : undefined,
      })

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item not found',
          code: 'NOT_FOUND',
        })
      }

      res.json({
        success: true,
        data: item,
      })
    } catch (error) {
      console.error('Library update error:', error)
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

      await libraryService.deleteItem(id, userId)

      res.status(204).send()
    } catch (error) {
      console.error('Library delete error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}
