import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma.js'
import { authService } from '../../services/auth.service.js'

let counter = 0
const uid = () => ++counter

export async function createUser(overrides: {
  email?: string
  password?: string
  username?: string
} = {}) {
  const n = uid()
  const user = await authService.createUser(
    overrides.email ?? `user${n}@example.com`,
    overrides.password ?? 'password123',
    overrides.username ?? `user${n}`,
  )
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' },
  )
  const refreshToken = await authService.createRefreshToken(user.id)
  return { user, token, refreshToken }
}

export async function createContentCache(overrides: {
  externalId?: string
  contentType?: 'movie' | 'tv'
  title?: string
  genres?: number[]
  voteAverage?: number
  overview?: string
} = {}) {
  const n = uid()
  return prisma.contentCache.create({
    data: {
      externalId: overrides.externalId ?? String(100000 + n),
      contentType: overrides.contentType ?? 'movie',
      title: overrides.title ?? `Test Movie ${n}`,
      posterPath: `/poster${n}.jpg`,
      voteAverage: overrides.voteAverage ?? 7.5,
      releaseYear: 2023,
      genres: overrides.genres ?? [28, 12],
      overview: overrides.overview ?? 'A test movie.',
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
}

export async function createLibraryItem(
  userId: string,
  content: { externalId: string; contentType: string },
  overrides: {
    status?: string
    personalRating?: number | null
    notes?: string | null
  } = {},
) {
  return prisma.libraryItem.create({
    data: {
      userId,
      externalId: content.externalId,
      contentType: content.contentType,
      status: overrides.status ?? 'watched',
      personalRating: overrides.personalRating ?? null,
      notes: overrides.notes ?? null,
    },
  })
}
