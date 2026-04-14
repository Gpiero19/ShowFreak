import dotenv from 'dotenv'

dotenv.config()

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/showfreak',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
    baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    imageBase: process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
}
