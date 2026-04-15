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
}
