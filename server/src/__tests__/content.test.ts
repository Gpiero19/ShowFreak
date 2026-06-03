import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'
import { tmdb } from '../lib/tmdb.js'

// Mock the singleton before any test runs — vitest hoists this automatically
vi.mock('../lib/tmdb.js', () => ({
  tmdb: {
    searchMovies: vi.fn(),
    searchTVShows: vi.fn(),
    getMovieDetails: vi.fn(),
    getTVShowDetails: vi.fn(),
    getSimilarMovies: vi.fn(),
    getSimilarTVShows: vi.fn(),
    client: { get: vi.fn() },
  },
}))

// Minimal TMDB response shape helpers
const mockSearchMovie = (id = 550) => ({
  id,
  title: `Movie ${id}`,
  release_date: '2023-01-15',
  poster_path: `/poster${id}.jpg`,
  vote_average: 7.5,
  genre_ids: [28, 12],
  overview: `Overview for movie ${id}.`,
})

const mockSearchTV = (id = 1400) => ({
  id,
  name: `Show ${id}`,
  first_air_date: '2023-06-01',
  poster_path: `/tv${id}.jpg`,
  vote_average: 8.1,
  genre_ids: [18, 9648],
  overview: `Overview for show ${id}.`,
})

const mockMovieDetails = (id = 550) => ({
  id,
  title: `Movie ${id}`,
  release_date: '2023-01-15',
  poster_path: `/poster${id}.jpg`,
  vote_average: 7.8,
  overview: `Overview for movie ${id}.`,
  tagline: 'A great tagline.',
  runtime: 132,
  status: 'Released',
  vote_count: 4200,
  popularity: 61.4,
  backdrop_path: `/backdrop${id}.jpg`,
  original_language: 'en',
  genres: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
  ],
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/content/search', () => {
  it('returns 200 with merged movie and TV results sorted by vote average', async () => {
    vi.mocked(tmdb.searchMovies).mockResolvedValueOnce({
      results: [mockSearchMovie(1), mockSearchMovie(2)],
    })
    vi.mocked(tmdb.searchTVShows).mockResolvedValueOnce({
      results: [mockSearchTV(10)],
    })

    const res = await request(app).get('/api/content/search?q=action')

    expect(res.status).toBe(200)
    expect(res.body.data.data).toHaveLength(3)
    expect(res.body.data.pagination.total).toBe(3)
  })

  it('writes results to content_cache including overview', async () => {
    vi.mocked(tmdb.searchMovies).mockResolvedValueOnce({
      results: [mockSearchMovie(9001)],
    })
    vi.mocked(tmdb.searchTVShows).mockResolvedValueOnce({ results: [] })

    await request(app).get('/api/content/search?q=inception')

    const cached = await prisma.contentCache.findFirst({
      where: { externalId: '9001', contentType: 'movie' },
    })
    expect(cached).not.toBeNull()
    expect(cached?.title).toBe('Movie 9001')
    expect(cached?.overview).toBe('Overview for movie 9001.')
    expect(cached?.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('returns 400 INVALID_QUERY for a query under 2 characters', async () => {
    const res = await request(app).get('/api/content/search?q=a')

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_QUERY')
    expect(vi.mocked(tmdb.searchMovies)).not.toHaveBeenCalled()
  })

  it('returns 400 INVALID_QUERY when the query param is missing', async () => {
    const res = await request(app).get('/api/content/search')

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_QUERY')
  })
})

describe('GET /api/content/:id', () => {
  it('fetches from TMDB on cache miss and returns full detail fields', async () => {
    vi.mocked(tmdb.getMovieDetails).mockResolvedValueOnce(mockMovieDetails(550))

    const res = await request(app).get('/api/content/550?type=movie')

    expect(res.status).toBe(200)
    expect(res.body.data.externalId).toBe('550')
    expect(res.body.data.title).toBe('Movie 550')
    expect(res.body.data.tagline).toBe('A great tagline.')
    expect(res.body.data.runtime).toBe(132)
    expect(res.body.data.genres).toEqual(['Action', 'Adventure'])
    expect(vi.mocked(tmdb.getMovieDetails)).toHaveBeenCalledTimes(1)
  })

  it('serves from cache on a second request without calling TMDB again', async () => {
    vi.mocked(tmdb.getMovieDetails).mockResolvedValueOnce(mockMovieDetails(551))

    // First request — cache miss, TMDB is called
    await request(app).get('/api/content/551?type=movie')

    // Second request — cache hit, TMDB must not be called again
    const res = await request(app).get('/api/content/551?type=movie')

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Movie 551')
    expect(vi.mocked(tmdb.getMovieDetails)).toHaveBeenCalledTimes(1)
  })

  it('writes the TMDB response to content_cache for future hits', async () => {
    vi.mocked(tmdb.getMovieDetails).mockResolvedValueOnce(mockMovieDetails(552))

    await request(app).get('/api/content/552?type=movie')

    const cached = await prisma.contentCache.findFirst({
      where: { externalId: '552', contentType: 'movie' },
    })
    expect(cached?.overview).toBe('Overview for movie 552.')
  })

  it('returns 400 INVALID_CONTENT_TYPE when the type param is absent', async () => {
    const res = await request(app).get('/api/content/550')

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_CONTENT_TYPE')
    expect(vi.mocked(tmdb.getMovieDetails)).not.toHaveBeenCalled()
  })

  it('returns 404 NOT_FOUND when TMDB itself returns a 404', async () => {
    vi.mocked(tmdb.getMovieDetails).mockRejectedValueOnce({
      response: { status: 404 },
    })

    const res = await request(app).get('/api/content/99999?type=movie')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('does not require authentication', async () => {
    vi.mocked(tmdb.getMovieDetails).mockResolvedValueOnce(mockMovieDetails(553))

    const res = await request(app).get('/api/content/553?type=movie')

    expect(res.status).toBe(200)
  })
})

describe('GET /api/content/:id/similar', () => {
  it('returns 200 with similar content for movies', async () => {
    vi.mocked(tmdb.getSimilarMovies).mockResolvedValueOnce({
      results: [mockSearchMovie(600), mockSearchMovie(601)],
    })

    const res = await request(app).get('/api/content/550/similar?type=movie')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0].contentType).toBe('movie')
    expect(res.body.data[0].externalId).toBeTruthy()
  })

  it('returns 400 INVALID_CONTENT_TYPE when the type param is absent', async () => {
    const res = await request(app).get('/api/content/550/similar')

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_CONTENT_TYPE')
  })

  it('does not require authentication', async () => {
    vi.mocked(tmdb.getSimilarMovies).mockResolvedValueOnce({ results: [] })

    const res = await request(app).get('/api/content/550/similar?type=movie')

    expect(res.status).toBe(200)
  })
})
