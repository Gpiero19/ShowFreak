import { PrismaClient } from '@prisma/client'
import { contentService } from './content.service.js'

const prisma = new PrismaClient()

export const recommendationService = {
  prisma,

  async getRecommendations(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const userLibrary = await prisma.libraryItem.findMany({
      where: { userId },
      include: { contentCache: true },
    })

    const userPreferences = await prisma.userPreference.findMany({
      where: { userId },
    })

    const dislikedExternalIds = userPreferences.map(p => p.externalId)
    const favoriteItems = userLibrary.filter(item => item.status === 'favorite')
    
    if (favoriteItems.length === 0) {
      const trending = await contentService.discover('movie', { sortBy: 'popularity.desc', page })
      return {
        data: trending.slice(0, limit),
        pagination: { page, limit, total: trending.length, totalPages: 1 },
      }
    }

    const genreCounts: Record<string, number> = {}
    for (const item of favoriteItems) {
      if (item.contentCache?.genres) {
        const genres = item.contentCache.genres as string[]
        for (const genre of genres) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1
        }
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)

    const recommendations: any[] = []
    
    for (const genre of topGenres) {
      const results = await contentService.discover('movie', { 
        sortBy: 'popularity.desc', 
        page 
      })
      
      for (const item of results) {
        if (!dislikedExternalIds.includes(item.externalId)) {
          const alreadyInLibrary = userLibrary.some(
            lib => lib.externalId === item.externalId
          )
          if (!alreadyInLibrary) {
            recommendations.push(item)
          }
        }
      }
    }

    const unique = recommendations.filter((item, index, self) => 
      index === self.findIndex(t => t.externalId === item.externalId)
    )

    return {
      data: unique.slice(0, limit),
      pagination: {
        page,
        limit,
        total: unique.length,
        totalPages: Math.ceil(unique.length / limit),
      },
    }
  },

  async getSimilarTo(externalId: string, contentType: string = 'movie', page: number = 1): Promise<any> {
    return contentService.getSimilar(externalId, contentType, page)
  },
}
