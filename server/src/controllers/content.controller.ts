import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { tmdb } from '../lib/tmdb.js'

interface ContentItemBase {
  externalId: string
  contentType: 'movie' | 'tv'
  title: string
  posterPath: string | null
  voteAverage: number | null
  releaseYear: number | null
  genres: string[]
  overview: string
}

export const contentController = {
  async search(req: Request, res: Response) {
    try {
      const { q, type, page = 1 } = req.query
      const query = q as string

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters',
          code: 'INVALID_QUERY',
        })
      }

      const contentTypes: ('movie' | 'tv')[] = type
        ? [type as 'movie' | 'tv']
        : ['movie', 'tv']
      const allResults: ContentItemBase[] = []
      const cacheUpserts: Parameters<typeof prisma.contentCache.upsert>[0][] = []
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      for (const contentType of contentTypes) {
        const data = await (contentType === 'movie'
          ? tmdb.searchMovies(query, parseInt(page as string))
          : tmdb.searchTVShows(query, parseInt(page as string))
        )

        for (const item of data.results ?? []) {
          const releaseYear = (item.release_date || item.first_air_date)?.split('-')[0]
            ? parseInt((item.release_date || item.first_air_date).split('-')[0])
            : null
          const cachePayload = {
            title: item.title || item.name,
            posterPath: item.poster_path,
            voteAverage: item.vote_average,
            releaseYear,
            genres: item.genre_ids || [],
            overview: item.overview || '',
            cachedAt: new Date(),
            expiresAt,
          }

          cacheUpserts.push({
            where: { externalId_contentType: { externalId: item.id.toString(), contentType } },
            update: cachePayload,
            create: { externalId: item.id.toString(), contentType, ...cachePayload },
          })

          allResults.push({
            externalId: item.id.toString(),
            contentType,
            title: item.title || item.name,
            posterPath: item.poster_path,
            voteAverage: item.vote_average,
            releaseYear,
            genres: item.genre_ids || [],
            overview: item.overview || '',
          })
        }
      }

      await prisma.$transaction(cacheUpserts.map(args => prisma.contentCache.upsert(args)))

      // Sort results by vote average (descending)
      allResults.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))

      const pageNum = parseInt(page as string)
      const limit = 20
      const startIndex = (pageNum - 1) * limit
      const paginatedResults = allResults.slice(startIndex, startIndex + limit)

      return res.json({
        success: true,
        data: {
          data: paginatedResults,
          pagination: {
            page: pageNum,
            limit,
            total: allResults.length,
            totalPages: Math.ceil(allResults.length / limit),
          },
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Content search error')
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
      const { type } = req.query

      if (!type || !['movie', 'tv'].includes(type as string)) {
        return res.status(400).json({
          success: false,
          error: 'Content type (movie or tv) is required',
          code: 'INVALID_CONTENT_TYPE',
        })
      }

      const contentType = type as 'movie' | 'tv'

      // Check cache first — skip TMDB if we have a fresh entry with overview
      const cached = await prisma.contentCache.findFirst({
        where: {
          externalId: id,
          contentType,
          expiresAt: { gt: new Date() },
          overview: { not: null },
        },
      })

      if (cached) {
        return res.json({
          success: true,
          data: {
            externalId: id,
            contentType,
            title: cached.title,
            posterPath: cached.posterPath,
            voteAverage: cached.voteAverage ? Number(cached.voteAverage) : null,
            releaseYear: cached.releaseYear,
            genres: Array.isArray(cached.genres) ? cached.genres : [],
            overview: cached.overview ?? '',
            tagline: null,
            runtime: null,
            status: '',
            voteCount: null,
            popularity: null,
            backdropPath: null,
            originalLanguage: '',
          },
        })
      }

      // Cache miss or expired — fetch from TMDB
      const data = await (contentType === 'movie'
        ? tmdb.getMovieDetails(id)
        : tmdb.getTVShowDetails(id)
      )

      const genreIds = data.genres?.map((g: any) => g.id) || []
      const genreNames = data.genres?.map((g: any) => g.name) || []
      const releaseYear = (data.release_date || data.first_air_date)?.split('-')[0]
        ? parseInt((data.release_date || data.first_air_date).split('-')[0])
        : null
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await prisma.contentCache.upsert({
        where: { externalId_contentType: { externalId: id, contentType } },
        update: {
          title: data.title || data.name,
          posterPath: data.poster_path,
          voteAverage: data.vote_average,
          releaseYear,
          genres: genreIds,
          overview: data.overview || '',
          cachedAt: new Date(),
          expiresAt,
        },
        create: {
          externalId: id,
          contentType,
          title: data.title || data.name,
          posterPath: data.poster_path,
          voteAverage: data.vote_average,
          releaseYear,
          genres: genreIds,
          overview: data.overview || '',
          cachedAt: new Date(),
          expiresAt,
        },
      })

      return res.json({
        success: true,
        data: {
          externalId: id,
          contentType,
          title: data.title || data.name,
          posterPath: data.poster_path,
          voteAverage: data.vote_average,
          releaseYear,
          genres: genreNames,
          overview: data.overview || '',
          tagline: data.tagline,
          runtime: data.runtime || data.episode_run_time?.[0] || null,
          status: data.status || '',
          voteCount: data.vote_count,
          popularity: data.popularity,
          backdropPath: data.backdrop_path,
          originalLanguage: data.original_language || '',
        },
      })
    } catch (error: any) {
      logger.error({ err: error }, 'Content details error')
      if (error.response?.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Content not found',
          code: 'NOT_FOUND',
        })
      }
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
      const { type, page = 1 } = req.query

      if (!type || !['movie', 'tv'].includes(type as string)) {
        return res.status(400).json({
          success: false,
          error: 'Content type (movie or tv) is required',
          code: 'INVALID_CONTENT_TYPE',
        })
      }

      const contentType = type as 'movie' | 'tv'

      const data = await (contentType === 'movie'
        ? tmdb.getSimilarMovies(id, parseInt(page as string))
        : tmdb.getSimilarTVShows(id, parseInt(page as string))
      )

      const results = (data.results || []).map((item: any) => ({
        externalId: item.id.toString(),
        contentType,
        title: item.title || item.name,
        posterPath: item.poster_path,
        voteAverage: item.vote_average,
        releaseYear: (item.release_date || item.first_air_date)?.split('-')[0] 
          ? parseInt((item.release_date || item.first_air_date)?.split('-')[0]!)
          : null,
        overview: item.overview || '',
      }))

      return res.json({
        success: true,
        data: results,
      })
    } catch (error) {
      logger.error({ err: error }, 'Content similar error')
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}