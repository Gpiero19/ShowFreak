import { tmdbService } from './tmdb.service.js'

export const contentService = {
  async search(query: string, contentType: string = 'movie', page: number = 1): Promise<any> {
    return tmdbService.search(query, contentType)
  },

  async getDetails(externalId: string, contentType: string): Promise<any> {
    return tmdbService.getDetailsRaw(externalId, contentType)
  },

  async getSimilar(externalId: string, contentType: string): Promise<any> {
    return tmdbService.getDetailsRaw(externalId, contentType)
  },
}
