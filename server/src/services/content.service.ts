import { tmdbService } from './tmdb.service.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CachedContent {
  externalId: string
  contentType: string
  title: string
  posterPath: string | null
  voteAverage: number | null
  releaseYear: number | null
  genres: string[]
}

export const contentService = {
  prisma,

  async search(query: string, contentType: string = 'movie', page: number = 1): Promise<any> {
    const result = await tmdbService.search(query, contentType)
    
    if (result?.results) {
      for (const item of result.results) {
        const contentTypeValue = item._contentType || contentType
        const cachedContent: CachedContent = {
          externalId: String(item.id),
          contentType: contentTypeValue,
          title: item.title || item.name || '',
          posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          voteAverage: item.vote_average || null,
          releaseYear: item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : null,
          genres: [],
        }
        await this.cacheContent(cachedContent)
      }
    }
    
    return result
  },

  async getDetails(externalId: string, contentType: string): Promise<any> {
    const cached = await prisma.contentCache.findUnique({
      where: {
        pk_cache_external_content: {
          externalId,
          contentType,
        },
      },
    })

    if (cached) {
      return {
        id: cached.externalId,
        title: cached.title,
        poster_path: cached.posterPath,
        vote_average: cached.voteAverage,
        release_date: cached.releaseYear ? `${cached.releaseYear}-01-01` : null,
        first_air_date: cached.releaseYear ? `${cached.releaseYear}-01-01` : null,
        genres: cached.genres,
        overview: '',
      }
    }

    const result = await tmdbService.getDetailsRaw(externalId, contentType)

    if (result) {
      const cachedContent: CachedContent = {
        externalId: String(result.id),
        contentType,
        title: result.title || result.name || '',
        posterPath: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null,
        voteAverage: result.vote_average || null,
        releaseYear: result.release_date || result.first_air_date ? new Date(result.release_date || result.first_air_date).getFullYear() : null,
        genres: result.genres?.map((g: any) => g.name) || [],
      }
      await this.cacheContent(cachedContent)
    }

    return result
  },

  async getSimilar(externalId: string, contentType: string): Promise<any> {
    return tmdbService.getDetailsRaw(externalId, contentType)
  },

  async discover(contentType: string, options: { genre?: number; year?: number; sortBy?: string; page?: number } = {}): Promise<any[]> {
    const { tmdbService } = await import('./tmdb.service.js')
    const result = await tmdbService.discoverRaw(contentType, options)
    return result
  },

  async cacheContent(item: CachedContent): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.contentCache.upsert({
      where: {
        pk_cache_external_content: {
          externalId: item.externalId,
          contentType: item.contentType,
        },
      },
      update: {
        title: item.title,
        posterPath: item.posterPath,
        voteAverage: item.voteAverage,
        releaseYear: item.releaseYear,
        genres: item.genres,
        cachedAt: new Date(),
        expiresAt,
      },
      create: {
        externalId: item.externalId,
        contentType: item.contentType,
        title: item.title,
        posterPath: item.posterPath,
        voteAverage: item.voteAverage,
        releaseYear: item.releaseYear,
        genres: item.genres,
        expiresAt,
      },
    })
  },
}
