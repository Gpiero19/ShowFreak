import axios, { AxiosInstance } from 'axios'

interface TMDBConfig {
  apiKey: string
  baseURL: string
  imageBaseURL: string
}

class TMDBService {
  private client: AxiosInstance
  private imageBaseURL: string

  constructor(config: TMDBConfig) {
    this.imageBaseURL = config.imageBaseURL
    this.client = axios.create({
      baseURL: config.baseURL,
      params: {
        api_key: config.apiKey,
        language: 'en-US',
      },
    })
  }

  getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) return ''
    return `${this.imageBaseURL}/${size}${path}`
  }

  async searchMovies(query: string, page: number = 1) {
    const response = await this.client.get('/search/movie', {
      params: { query, page },
    })
    return response.data
  }

  async searchTVShows(query: string, page: number = 1) {
    const response = await this.client.get('/search/tv', {
      params: { query, page },
    })
    return response.data
  }

  async getMovieDetails(id: string) {
    const response = await this.client.get(`/movie/${id}`)
    return response.data
  }

  async getTVShowDetails(id: string) {
    const response = await this.client.get(`/tv/${id}`)
    return response.data
  }

  async getSimilarMovies(id: string, page: number = 1) {
    const response = await this.client.get(`/movie/${id}/similar`, {
      params: { page },
    })
    return response.data
  }

  async getSimilarTVShows(id: string, page: number = 1) {
    const response = await this.client.get(`/tv/${id}/similar`, {
      params: { page },
    })
    return response.data
  }

  async discoverByGenres(genreIds: string | string[], contentType: 'movie' | 'tv') {
    const response = await this.client.get(`/discover/${contentType}`, {
      params: { with_genres: Array.isArray(genreIds) ? genreIds.join(',') : genreIds },
    })
    return response.data
  }

  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
    const response = await this.client.get(`/trending/${mediaType}/${timeWindow}`)
    return response.data
  }
}

export function createTMDBService(apiKey: string, baseURL = 'https://api.themoviedb.org/3', imageBaseURL = 'https://image.tmdb.org/t/p') {
  return new TMDBService({ apiKey, baseURL, imageBaseURL })
}