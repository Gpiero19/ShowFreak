import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recommendationService } from '../services/recommendation.service.js'
import { prisma } from '../lib/prisma.js'
import { tmdb } from '../lib/tmdb.js'

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    libraryItem: { findMany: vi.fn() },
    userPreference: { findMany: vi.fn() },
  },
}))

vi.mock('../lib/tmdb.js', () => ({
  tmdb: {
    getTrending: vi.fn(),
    getSimilarMovies: vi.fn(),
    getSimilarTVShows: vi.fn(),
    client: { get: vi.fn() },
  },
}))

const USER_ID = 'test-user-id'

// Minimal library item with content_cache joined
const libItem = ({
  externalId = '100',
  contentType = 'movie' as 'movie' | 'tv',
  status = 'watched',
  personalRating = null as number | null,
  genres = [28] as number[],
} = {}) => ({
  id: externalId,
  userId: USER_ID,
  externalId,
  contentType,
  status,
  personalRating,
  notes: null,
  watchedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  content_cache: {
    externalId,
    contentType,
    title: `Content ${externalId}`,
    posterPath: null,
    voteAverage: null,
    releaseYear: null,
    genres,
    overview: null,
    cachedAt: new Date(),
    expiresAt: new Date(),
  },
})

// Minimal TMDB discover / trending result item
const discoverItem = ({
  id = 999,
  voteAverage = 7.5,
  mediaType = undefined as string | undefined,
} = {}) => ({
  id,
  title: `Movie ${id}`,
  media_type: mediaType,
  release_date: '2023-01-01',
  poster_path: null,
  vote_average: voteAverage,
  genre_ids: [28],
})

const mockDiscover = (results: ReturnType<typeof discoverItem>[]) => {
  vi.mocked(tmdb.client.get).mockResolvedValue({ data: { results } })
}

const mockTrending = (results = [discoverItem({ id: 1, mediaType: 'movie' })]) => {
  vi.mocked(tmdb.getTrending).mockResolvedValue({ results })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.userPreference.findMany).mockResolvedValue([])
})

// ─── Trending fallback ──────────────────────────────────────────────────────

describe('trending fallback', () => {
  it('returns trending when the library is empty', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([])
    mockTrending([discoverItem({ id: 10, mediaType: 'movie' }), discoverItem({ id: 11, mediaType: 'tv' })])

    const result = await recommendationService.getRecommendations(USER_ID, 5)

    expect(result.basedOn).toBe('trending')
    expect(result.items[0].source).toBe('trending')
    expect(vi.mocked(tmdb.getTrending)).toHaveBeenCalledOnce()
    expect(vi.mocked(tmdb.client.get)).not.toHaveBeenCalled()
  })

  it('falls back to trending when all discover results are already in the library', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '550', genres: [28] }),
    ])
    mockDiscover([discoverItem({ id: 550 })]) // exact match — filtered out
    mockTrending()

    const result = await recommendationService.getRecommendations(USER_ID, 5)

    expect(result.basedOn).toBe('trending_fallback')
    expect(vi.mocked(tmdb.getTrending)).toHaveBeenCalledOnce()
  })

  it('falls back to trending when all discover results are disliked', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', genres: [28] }),
    ])
    vi.mocked(prisma.userPreference.findMany).mockResolvedValue([
      { externalId: '999', contentType: 'movie' } as any,
    ])
    mockDiscover([discoverItem({ id: 999 })]) // disliked — filtered out
    mockTrending()

    const result = await recommendationService.getRecommendations(USER_ID, 5)

    expect(result.basedOn).toBe('trending_fallback')
  })
})

// ─── Genre weighting ────────────────────────────────────────────────────────

describe('genre weighting', () => {
  it('ignores non-watched items when building genre weights', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', status: 'wishlist', genres: [99] }), // should be ignored
      libItem({ externalId: '2', status: 'watched', genres: [28] }),  // should count
    ])
    mockDiscover([discoverItem({ id: 777 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const withGenres = vi.mocked(tmdb.client.get).mock.calls[0][1].params.with_genres as string
    expect(withGenres).toContain('28')
    expect(withGenres).not.toContain('99')
  })

  it('gives a rating-5 item weight 3, so it outranks four unrated items in the same genre', async () => {
    // Genre 100: 1×rating-5 → weight 3.0
    // Genre 200: 4×unrated  → weight 4×0.5 = 2.0
    // Expected order: 100 first, 200 second
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', personalRating: 5, genres: [100] }),
      libItem({ externalId: '2', personalRating: null, genres: [200] }),
      libItem({ externalId: '3', personalRating: null, genres: [200] }),
      libItem({ externalId: '4', personalRating: null, genres: [200] }),
      libItem({ externalId: '5', personalRating: null, genres: [200] }),
    ])
    mockDiscover([discoverItem({ id: 999 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const withGenres = vi.mocked(tmdb.client.get).mock.calls[0][1].params.with_genres as string
    expect(withGenres.split(',')[0]).toBe('100')
  })

  it('gives a rating-4 item weight 2, so it outranks three unrated items', async () => {
    // Genre 100: 1×rating-4 → weight 2.0
    // Genre 200: 3×unrated  → weight 3×0.5 = 1.5
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', personalRating: 4, genres: [100] }),
      libItem({ externalId: '2', personalRating: null, genres: [200] }),
      libItem({ externalId: '3', personalRating: null, genres: [200] }),
      libItem({ externalId: '4', personalRating: null, genres: [200] }),
    ])
    mockDiscover([discoverItem({ id: 999 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const withGenres = vi.mocked(tmdb.client.get).mock.calls[0][1].params.with_genres as string
    expect(withGenres.split(',')[0]).toBe('100')
  })

  it('gives a rating-3 item weight 1, so it outranks one unrated item', async () => {
    // Genre 100: 1×rating-3 → weight 1.0
    // Genre 200: 1×unrated  → weight 0.5
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', personalRating: 3, genres: [100] }),
      libItem({ externalId: '2', personalRating: null, genres: [200] }),
    ])
    mockDiscover([discoverItem({ id: 999 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const withGenres = vi.mocked(tmdb.client.get).mock.calls[0][1].params.with_genres as string
    expect(withGenres.split(',')[0]).toBe('100')
  })

  it('gives an unrated watched item weight 0.5, contributing to genre weights', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', personalRating: null, genres: [555] }),
    ])
    mockDiscover([discoverItem({ id: 999 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const withGenres = vi.mocked(tmdb.client.get).mock.calls[0][1].params.with_genres as string
    expect(withGenres).toContain('555')
  })

  it('selects the top 3 genres by weight and excludes the 4th', async () => {
    // Weights: genre 10 → 3, genre 20 → 2, genre 30 → 1, genre 40 → 0.5
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', personalRating: 5, genres: [10] }),
      libItem({ externalId: '2', personalRating: 4, genres: [20] }),
      libItem({ externalId: '3', personalRating: 3, genres: [30] }),
      libItem({ externalId: '4', personalRating: null, genres: [40] }),
    ])
    mockDiscover([discoverItem({ id: 999 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const withGenres = vi.mocked(tmdb.client.get).mock.calls[0][1].params.with_genres as string
    expect(withGenres).toContain('10')
    expect(withGenres).toContain('20')
    expect(withGenres).toContain('30')
    expect(withGenres).not.toContain('40')
  })
})

// ─── Content type routing ───────────────────────────────────────────────────

describe('content type routing', () => {
  it('queries only /discover/movie for a movie-only library', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', contentType: 'movie', genres: [28] }),
    ])
    mockDiscover([discoverItem({ id: 999 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const calls = vi.mocked(tmdb.client.get).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toBe('/discover/movie')
  })

  it('queries only /discover/tv for a TV-only library', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', contentType: 'tv', genres: [18] }),
    ])
    mockDiscover([discoverItem({ id: 999 })])

    await recommendationService.getRecommendations(USER_ID, 5)

    const calls = vi.mocked(tmdb.client.get).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toBe('/discover/tv')
  })

  it('queries both /discover/movie and /discover/tv for a mixed library', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', contentType: 'movie', genres: [28] }),
      libItem({ externalId: '2', contentType: 'tv', genres: [18] }),
    ])
    vi.mocked(tmdb.client.get)
      .mockResolvedValueOnce({ data: { results: [discoverItem({ id: 998 })] } })
      .mockResolvedValueOnce({ data: { results: [discoverItem({ id: 999 })] } })

    await recommendationService.getRecommendations(USER_ID, 5)

    const endpoints = vi.mocked(tmdb.client.get).mock.calls.map(c => c[0])
    expect(endpoints).toContain('/discover/movie')
    expect(endpoints).toContain('/discover/tv')
  })
})

// ─── Filtering and sorting ──────────────────────────────────────────────────

describe('filtering and sorting', () => {
  it('excludes items already in the library from recommendations', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '550', genres: [28] }),
    ])
    mockDiscover([
      discoverItem({ id: 550 }), // already in library
      discoverItem({ id: 999 }), // new — should appear
    ])

    const result = await recommendationService.getRecommendations(USER_ID, 5)

    const ids = result.items.map(i => i.externalId)
    expect(ids).not.toContain('550')
    expect(ids).toContain('999')
  })

  it('excludes disliked items from recommendations', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', genres: [28] }),
    ])
    vi.mocked(prisma.userPreference.findMany).mockResolvedValue([
      { externalId: '999', contentType: 'movie' } as any,
    ])
    mockDiscover([
      discoverItem({ id: 999 }), // disliked — excluded
      discoverItem({ id: 888 }), // allowed
    ])

    const result = await recommendationService.getRecommendations(USER_ID, 5)

    const ids = result.items.map(i => i.externalId)
    expect(ids).not.toContain('999')
    expect(ids).toContain('888')
  })

  it('returns results sorted by vote_average descending', async () => {
    vi.mocked(prisma.libraryItem.findMany).mockResolvedValue([
      libItem({ externalId: '1', genres: [28] }),
    ])
    mockDiscover([
      discoverItem({ id: 100, voteAverage: 6.0 }),
      discoverItem({ id: 200, voteAverage: 9.2 }),
      discoverItem({ id: 300, voteAverage: 7.8 }),
    ])

    const result = await recommendationService.getRecommendations(USER_ID, 10)

    const averages = result.items.map(i => i.voteAverage)
    expect(averages[0]).toBe(9.2)
    expect(averages[1]).toBe(7.8)
    expect(averages[2]).toBe(6.0)
  })
})
