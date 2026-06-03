import dotenv from 'dotenv'
import { StringValue } from 'ms'

dotenv.config()

const KNOWN_INSECURE_SECRETS = new Set([
  'your-super-secret-key-min-32-chars',
  'your-super-secret-key-min-32-chars-here',
  'secret',
  'changeme',
])

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function requireSecret(key: string): string {
  const value = requireEnv(key)
  if (KNOWN_INSECURE_SECRETS.has(value)) {
    throw new Error(
      `Environment variable ${key} is set to a known insecure placeholder. ` +
      `Generate a real secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    )
  }
  return value
}

const isProduction = process.env.NODE_ENV === 'production'

export const config = {
  database: {
    url: isProduction
      ? requireEnv('DATABASE_URL')
      : (process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/showfreak'),
  },
  jwt: {
    secret: isProduction
      ? requireSecret('JWT_SECRET')
      : (process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production'),
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as StringValue,
  },
  tmdb: {
    apiKey: requireEnv('TMDB_API_KEY'),
    baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    imageBase: process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
}
