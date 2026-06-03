import { prisma } from '../lib/prisma.js'
import { tmdb } from '../lib/tmdb.js'

interface RecommendationItem {
  externalId: string
  contentType: 'movie' | 'tv'
  title: string
  posterPath: string | null
  voteAverage: number | null
  releaseYear: number | null
  genres: string[]
  source: 'genre_preference' | 'watch_history' | 'similar_to' | 'trending'
}

export const recommendationService = {
  async getRecommendations(userId: string, limit: number = 20, basedOn?: string) {
    // If basedOn is provided, delegate to similar recommendations
    if (basedOn) {
      const [contentId, type] = basedOn.split(':')
      if (contentId && type) {
        return this.getSimilarRecommendations(userId, contentId, type as 'movie' | 'tv', limit)
      }
    }

    // Get user's library items
    const libraryItems = await prisma.libraryItem.findMany({
      where: { userId },
      include: {
        content_cache: true,
      },
      orderBy: { watchedAt: 'desc' },
    })

    if (libraryItems.length === 0) {
      // No library yet, return trending
      return this.getTrendingRecommendations(limit)
    }

    // 1. Get user's disliked content IDs
    const dislikes = await prisma.userPreference.findMany({
      where: { userId },
      select: { externalId: true, contentType: true },
    })
    const dislikedIds = new Set(
      dislikes.map(d => `${d.contentType}:${d.externalId}`)
    )

    // 2. Calculate genre weights
    const genreWeights: Record<string, number> = {}
    const contentTypeCounts: { movie: number; tv: number } = { movie: 0, tv: 0 }

    for (const item of libraryItems) {
      const { status, personalRating, content_cache } = item
      if (status !== 'watched') continue

      const rating = personalRating || 0
      let weight = 0.5
      if (rating === 5) weight = 3
      else if (rating === 4) weight = 2
      else if (rating === 3) weight = 1

      const genres = (content_cache.genres || []) as string[]
      for (const genreId of genres) {
        genreWeights[genreId] = (genreWeights[genreId] || 0) + weight
      }

      if (item.contentType === 'movie' || item.contentType === 'tv') {
        contentTypeCounts[item.contentType]++
      }
    }

    // 3. Get top 3 genres
    const topGenres = Object.entries(genreWeights)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id)

    // 4. Determine preferred type
    const preferredType = contentTypeCounts.movie >= contentTypeCounts.tv ? 'movie' : 'tv'

    // 5. Query TMDB discover
    const discoverParams: any = {
      with_genres: topGenres.join(','),
      sort_by: 'vote_average.desc',
      vote_average_gte: 6,
      page: 1,
    }

    const hasMoviePreference = contentTypeCounts.movie > 0
    const hasTVPreference = contentTypeCounts.tv > 0

    let results: any[] = []

    if (hasMoviePreference && !hasTVPreference) {
      discoverParams.with_type = 'movie'
      const response = await tmdb.client.get('/discover/movie', { params: discoverParams })
      results = response.data?.results || []
    } else if (hasTVPreference && !hasMoviePreference) {
      discoverParams.with_type = 'tv'
      const response = await tmdb.client.get('/discover/tv', { params: discoverParams })
      results = response.data?.results || []
    } else {
      // User watches both, get from both types
      const [movieRes, tvRes] = await Promise.all([
        tmdb.client.get('/discover/movie', { params: { ...discoverParams, with_type: 'movie' } }),
        tmdb.client.get('/discover/tv', { params: { ...discoverParams, with_type: 'tv' } }),
      ])
      results = [
        ...(movieRes.data?.results || []),
        ...(tvRes.data?.results || []),
      ]
    }

    // 6. Filter out library items and dislikes
    const libraryExternalIds = new Set(libraryItems.map(li => li.externalId))

    const filtered = results.filter((item: any) => {
      const extId = item.id.toString()
      const contentType = item.media_type === 'tv' ? 'tv' : 'movie'
      if (libraryExternalIds.has(extId)) return false
      if (dislikedIds.has(`${contentType}:${extId}`)) return false
      return true
    })

    // 7. Sort by vote average and limit
    filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    const finalResults = filtered.slice(0, limit)

    // Fallback to trending if no recommendations match criteria
    if (finalResults.length === 0) {
      const trending = await this.getTrendingRecommendations(limit)
      return {
        items: trending.items,
        basedOn: 'trending_fallback',
        pagination: trending.pagination,
      }
    }

    const items: RecommendationItem[] = finalResults.map((item: any) => ({
      externalId: item.id.toString(),
      contentType: item.media_type === 'tv' ? 'tv' : 'movie',
      title: item.title || item.name,
      posterPath: item.poster_path,
      voteAverage: item.vote_average,
      releaseYear: (item.release_date || item.first_air_date)?.split('-')[0]
        ? parseInt((item.release_date || item.first_air_date)?.split('-')[0]!)
        : null,
      genres: item.genre_ids || [],
      source: 'genre_preference',
    }))

    return {
      items,
      basedOn: topGenres.length > 0 ? `genres:${topGenres.join(',')}` : 'trending',
      pagination: { page: 1, limit, total: items.length, totalPages: 1 },
    }
  },

  async getSimilarRecommendations(userId: string, contentId: string, type: 'movie' | 'tv', limit: number = 20) {

    const data = await (type === 'movie'
      ? tmdb.getSimilarMovies(contentId)
      : tmdb.getSimilarTVShows(contentId)
    )

    // Exclude items already in library and disliked
    const libraryItems = await prisma.libraryItem.findMany({
      where: { userId },
      select: { externalId: true },
    })
    const libraryIds = new Set(libraryItems.map(li => li.externalId))

    const dislikes = await prisma.userPreference.findMany({
      where: { userId },
      select: { externalId: true, contentType: true },
    })
    const dislikedIds = new Set(dislikes.map(d => `${d.contentType}:${d.externalId}`))

    const results = (data.results || [])
      .filter((item: any) => {
        const extId = item.id.toString()
        if (libraryIds.has(extId)) return false
        if (dislikedIds.has(`${type}:${extId}`)) return false
        return true
      })
      .slice(0, limit)
      .map((item: any) => ({
        externalId: item.id.toString(),
        contentType: type,
        title: item.title || item.name,
        posterPath: item.poster_path,
        voteAverage: item.vote_average,
        releaseYear: (item.release_date || item.first_air_date)?.split('-')[0]
          ? parseInt((item.release_date || item.first_air_date)?.split('-')[0]!)
          : null,
        genres: item.genre_ids || [],
        source: 'similar_to' as const,
      }))

    return {
      items: results,
      basedOn: `similar_to:${contentId}`,
      pagination: { page: 1, limit, total: results.length, totalPages: 1 },
    }
  },

  async getTrendingRecommendations(limit: number = 20) {

    const trending = await tmdb.getTrending('all', 'week')
    const results = (trending.results || []).slice(0, limit).map((item: any) => ({
      externalId: item.id.toString(),
      contentType: item.media_type === 'tv' ? 'tv' : 'movie',
      title: item.title || item.name,
      posterPath: item.poster_path,
      voteAverage: item.vote_average,
      releaseYear: (item.release_date || item.first_air_date)?.split('-')[0]
        ? parseInt((item.release_date || item.first_air_date)?.split('-')[0]!)
        : null,
      genres: item.genre_ids || [],
      source: 'trending' as const,
    }))

    return {
      items: results,
      basedOn: 'trending',
      pagination: { page: 1, limit, total: results.length, totalPages: 1 },
    }
  },
}