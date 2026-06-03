import { createTMDBService } from '../services/tmdb.service.js'
import { config } from '../config/index.js'

export const tmdb = createTMDBService(
  config.tmdb.apiKey,
  config.tmdb.baseUrl,
  config.tmdb.imageBase,
)
