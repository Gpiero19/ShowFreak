import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'\nimport { logger } from '../lib/logger.js'

interface LibraryItem {
  id: string
  userId: string
  externalId: string
  contentType: 'movie' | 'tv'
  status: string
  personalRating: number | null
  notes: string | null
  watchedAt: Date | null
  createdAt: Date
  updatedAt: Date
  title: string
  posterPath: string | null
  voteAverage: number | null
  releaseYear: number | null
  genres: string[]
}

export const libraryController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const { status, type, q, genre, sort = 'created_at', order = 'desc', page = 1, limit = 20, externalId, minImdbRating, minPersonalRating } = req.query

      const whereClause: any = { userId }

      if (externalId) {
        whereClause.externalId = externalId as string
      }
      if (status) {
        whereClause.status = status as string
      }
      if (type) {
        whereClause.contentType = type as string
      }

      // Build base query
      const buildWhere = () => {
        let baseWhere = { ...whereClause }

        if (q) {
          baseWhere.content_cache = {
            title: {
              contains: q as string,
              mode: 'insensitive',
            },
          }
        } else if (genre) {
          baseWhere.content_cache = {
            genres: {
              has: genre as string,
            },
          }
        }

        // Add minimum rating filters to content_cache or libraryItem
        if (minImdbRating) {
          const rating = parseFloat(minImdbRating as string)
          if (!baseWhere.content_cache) {
            baseWhere.content_cache = {}
          }
          baseWhere.content_cache.voteAverage = {
            gte: rating,
          }
        }

        if (minPersonalRating) {
          const rating = parseFloat(minPersonalRating as string)
          baseWhere.personalRating = {
            gte: rating,
          }
        }

        return baseWhere
      }

      const where = buildWhere()

      // Get total count
      const total = await prisma.libraryItem.count({
        where,
      })

      // Determine orderBy
      const orderBy: any = {}
      const orderDirection = order === 'asc' ? 'asc' : 'desc'

      switch (sort) {
        case 'vote_average':
          orderBy.content_cache = { voteAverage: orderDirection }
          break
        case 'release_year':
          orderBy.content_cache = { releaseYear: orderDirection }
          break
        case 'personal_rating':
          orderBy.personalRating = orderDirection
          break
        case 'title':
          orderBy.content_cache = { title: orderDirection }
          break
        case 'created_at':
        default:
          orderBy.createdAt = orderDirection
          break
      }

      // Fetch items with pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
      const items = await prisma.libraryItem.findMany({
        where,
        include: { content_cache: true },
        orderBy,
        skip,
        take: parseInt(limit as string),
      })

      const libraryItems: LibraryItem[] = items.map((item) => ({
        id: item.id,
        userId: item.userId,
        externalId: item.externalId,
        contentType: item.contentType as 'movie' | 'tv',
        status: item.status,
        personalRating: item.personalRating ? Number(item.personalRating) : null,
        notes: item.notes,
        watchedAt: item.watchedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        title: item.content_cache.title,
        posterPath: item.content_cache.posterPath,
        voteAverage: item.content_cache.voteAverage ? Number(item.content_cache.voteAverage) : null,
        releaseYear: item.content_cache.releaseYear,
        genres: Array.isArray(item.content_cache.genres) 
          ? item.content_cache.genres as unknown as string[]
          : [],
      }))

      return res.json({
        success: true,
        data: {
          data: libraryItems,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Library getAll error')
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
       const { externalId, contentType, status, personalRating } = req.body

       if (!externalId || !contentType || !status) {
         return res.status(400).json({
           success: false,
           error: 'externalId, contentType, and status are required',
           code: 'MISSING_FIELDS',
         })
       }

       // Validate personalRating if provided
       let validatedPersonalRating: number | undefined = undefined
       if (personalRating !== undefined) {
         const rating = parseInt(personalRating)
         if (isNaN(rating) || rating < 1 || rating > 5) {
           return res.status(400).json({
             success: false,
             error: 'Personal rating must be an integer between 1 and 5',
             code: 'INVALID_RATING',
           })
         }
         validatedPersonalRating = rating
       }

       const existing = await prisma.libraryItem.findFirst({
         where: { userId, externalId, contentType },
       })

       if (existing) {
         return res.status(409).json({
           success: false,
           error: 'Item already exists in library',
           code: 'ALREADY_EXISTS',
           data: existing,
         })
       }

       const libraryItem = await prisma.libraryItem.create({
         data: { 
           userId, 
           externalId, 
           contentType, 
           status,
           ...(validatedPersonalRating !== undefined && { personalRating: validatedPersonalRating })
         },
         include: { content_cache: true },
       })

       const responseItem: LibraryItem = {
         id: libraryItem.id,
         userId: libraryItem.userId,
         externalId: libraryItem.externalId,
         contentType: libraryItem.contentType as 'movie' | 'tv',
         status: libraryItem.status,
         personalRating: libraryItem.personalRating ? Number(libraryItem.personalRating) : null,
         notes: libraryItem.notes,
         watchedAt: libraryItem.watchedAt,
         createdAt: libraryItem.createdAt,
         updatedAt: libraryItem.updatedAt,
         title: libraryItem.content_cache.title,
         posterPath: libraryItem.content_cache.posterPath,
         voteAverage: libraryItem.content_cache.voteAverage ? Number(libraryItem.content_cache.voteAverage) : null,
         releaseYear: libraryItem.content_cache.releaseYear,
         genres: Array.isArray(libraryItem.content_cache.genres)
           ? libraryItem.content_cache.genres as unknown as string[]
           : [],
       }

       res.status(201).json({ success: true, data: responseItem })
     } catch (error) {
       logger.error({ err: error }, 'Library create error')
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

       const existing = await prisma.libraryItem.findFirst({
         where: { id, userId },
       })

       if (!existing) {
         return res.status(404).json({
           success: false,
           error: 'Library item not found',
           code: 'NOT_FOUND',
         })
       }

       const updateData: any = {}
       if (status !== undefined) updateData.status = status
      if (personalRating !== undefined) {
        // Validate personalRating is integer 1-5
        const rating = parseInt(personalRating)
        if (isNaN(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            error: 'Personal rating must be an integer between 1 and 5',
            code: 'INVALID_RATING',
          })
        }
        updateData.personalRating = rating
      }
       if (notes !== undefined) updateData.notes = notes
       if (watchedAt !== undefined) updateData.watchedAt = watchedAt

       const libraryItem = await prisma.libraryItem.update({
         where: { id },
         data: updateData,
         include: { content_cache: true },
       })

       const responseItem: LibraryItem = {
         id: libraryItem.id,
         userId: libraryItem.userId,
         externalId: libraryItem.externalId,
         contentType: libraryItem.contentType as 'movie' | 'tv',
         status: libraryItem.status,
         personalRating: libraryItem.personalRating ? Number(libraryItem.personalRating) : null,
         notes: libraryItem.notes,
         watchedAt: libraryItem.watchedAt,
         createdAt: libraryItem.createdAt,
         updatedAt: libraryItem.updatedAt,
         title: libraryItem.content_cache.title,
         posterPath: libraryItem.content_cache.posterPath,
         voteAverage: libraryItem.content_cache.voteAverage ? Number(libraryItem.content_cache.voteAverage) : null,
         releaseYear: libraryItem.content_cache.releaseYear,
         genres: Array.isArray(libraryItem.content_cache.genres)
           ? libraryItem.content_cache.genres as unknown as string[]
           : [],
       }

       return res.json({ success: true, data: responseItem })
     } catch (error) {
       logger.error({ err: error }, 'Library update error')
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

      const existing = await prisma.libraryItem.findFirst({
        where: { id, userId },
      })

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Library item not found',
          code: 'NOT_FOUND',
        })
      }

      await prisma.libraryItem.delete({ where: { id } })
      res.status(204).json({ success: true })
    } catch (error) {
      logger.error({ err: error }, 'Library delete error')
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}