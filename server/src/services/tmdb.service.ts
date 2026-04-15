import { config } from '../config/index.js'

export const tmdbService = {
  async fetchWithRetry(endpoint: string): Promise<any> {
    const url = config.tmdb.baseUrl + endpoint + '&api_key=' + config.tmdb.apiKey
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('TMDB error: ' + response.status)
    }
    return response.json()
  },

  async getDetailsRaw(externalId: string, contentType: string): Promise<any> {
    const endpoint = '/' + contentType + '/' + externalId
    return this.fetchWithRetry(endpoint)
  },

  async search(query: string, contentType: string): Promise<any> {
    const endpoint = '/search/' + contentType + '?query=' + encodeURIComponent(query)
    return this.fetchWithRetry(endpoint)
  },

  async discoverRaw(contentType: string, options: { genre?: number; year?: number; sortBy?: string; page?: number } = {}): Promise<any[]> {
    const { genre, year, sortBy = 'popularity.desc', page = 1 } = options
    let endpoint = '/' + contentType + '/discover?sort_by=' + sortBy + '&page=' + page
    if (genre) endpoint += '&with_genres=' + genre
    if (year) endpoint += '&primary_release_year=' + year
    const result: any = await this.fetchWithRetry(endpoint)
    return result?.results || []
  },
}
