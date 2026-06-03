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

      for (const contentType of contentTypes) {
        const data = await (contentType === 'movie'
          ? tmdb.searchMovies(query, parseInt(page as string))
          : tmdb.searchTVShows(query, parseInt(page as string))
        )

        if (data.results) {
          for (const item of data.results) {
            // Cache or update content_cache using composite key
            await prisma.contentCache.upsert({
              where: {
                externalId_contentType: {
                  externalId: item.id.toString(),
                  contentType,
                },
              },
              update: {
                title: item.title || item.name,
                posterPath: item.poster_path,
                voteAverage: item.vote_average,
                releaseYear: (item.release_date || item.first_air_date)?.split('-')[0] 
                  ? parseInt((item.release_date || item.first_air_date)?.split('-')[0]!)
                  : null,
                genres: item.genre_ids || [],
                cachedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
              create: {
                externalId: item.id.toString(),
                contentType,
                title: item.title || item.name,
                posterPath: item.poster_path,
                voteAverage: item.vote_average,
                releaseYear: (item.release_date || item.first_air_date)?.split('-')[0] 
                  ? parseInt((item.release_date || item.first_air_date)?.split('-')[0]!)
                  : null,
                genres: item.genre_ids || [],
                cachedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            })

            allResults.push({
              externalId: item.id.toString(),
              contentType,
              title: item.title || item.name,
              posterPath: item.poster_path,
              voteAverage: item.vote_average,
              releaseYear: (item.release_date || item.first_air_date)?.split('-')[0] 
                ? parseInt((item.release_date || item.first_air_date)!.split('-')[0]!)
                : null,
              genres: item.genre_ids || [],
              overview: item.overview || '',
            })
          }
        }
      }

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
      const { type } = req.query

      if (!type || !['movie', 'tv'].includes(type as string)) {
        return res.status(400).json({
          success: false,
          error: 'Content type (movie or tv) is required',
          code: 'INVALID_CONTENT_TYPE',
        })
      }

      const contentType = type as 'movie' | 'tv'

       // Get details from TMDB
       const data = await (contentType === 'movie'
         ? tmdb.getMovieDetails(id)
         : tmdb.getTVShowDetails(id)
       )

       // Extract genre IDs for caching and names for frontend response
       const genreIds = data.genres?.map((g: any) => g.id) || []
       const genreNames = data.genres?.map((g: any) => g.name) || []

       // Cache/update content_cache using composite key (store genre IDs)
       await prisma.contentCache.upsert({
         where: {
           externalId_contentType: {
             externalId: id,
             contentType,
           },
         },
         update: {
           contentType,
           title: data.title || data.name,
           posterPath: data.poster_path,
           voteAverage: data.vote_average,
           releaseYear: (data.release_date || data.first_air_date)?.split('-')[0] 
             ? parseInt((data.release_date || data.first_air_date)?.split('-')[0]!)
             : null,
           genres: genreIds,
           cachedAt: new Date(),
           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
         },
         create: {
           externalId: id,
           contentType,
           title: data.title || data.name,
           posterPath: data.poster_path,
           voteAverage: data.vote_average,
           releaseYear: (data.release_date || data.first_air_date)?.split('-')[0] 
             ? parseInt((data.release_date || data.first_air_date)?.split('-')[0]!)
             : null,
           genres: genreIds,
           cachedAt: new Date(),
           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
         },
       })

       const details = {
         externalId: id,
         contentType,
         title: data.title || data.name,
         posterPath: data.poster_path,
         voteAverage: data.vote_average,
         releaseYear: (data.release_date || data.first_air_date)?.split('-')[0] 
           ? parseInt((data.release_date || data.first_air_date)?.split('-')[0]!)
           : null,
         genres: genreNames,
         overview: data.overview || '',
         tagline: data.tagline,
         runtime: data.runtime || data.episode_run_time?.[0] || null,
         status: data.status || '',
         voteCount: data.vote_count,
         popularity: data.popularity,
         backdropPath: data.backdrop_path,
         originalLanguage: data.original_language || '',
       }

      return res.json({
        success: true,
        data: details,
      })
    } catch (error: any) {
      console.error('Content details error:', error)
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
      console.error('Content similar error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}