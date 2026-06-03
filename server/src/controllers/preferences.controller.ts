import { Request, Response } from 'express'
import { preferencesService } from '../services/preferences.service.js'
import { logger } from '../lib/logger.js'

export const preferencesController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const preferences = await preferencesService.getAll(userId)

      res.json({
        success: true,
        data: preferences,
      })
    } catch (error) {
      logger.error({ err: error }, 'Preferences get error')
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

      if (!externalId || !contentType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
        })
      }

      const preference = await preferencesService.create(userId, {
        externalId,
        contentType,
        dislikeReason,
      })

      res.status(201).json({
        success: true,
        data: preference,
      })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'Preference already exists',
          code: 'DUPLICATE_PREFERENCE',
        })
      }
      logger.error({ err: error }, 'Preferences create error')
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

      await preferencesService.delete(id, userId)

      res.status(204).send()
    } catch (error) {
      logger.error({ err: error }, 'Preferences delete error')
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}
