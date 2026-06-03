import { prisma } from '../lib/prisma.js'

export const preferencesService = {
  async getAll(userId: string) {
    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (preferences.length === 0) return []

    const cacheEntries = await prisma.contentCache.findMany({
      where: {
        OR: preferences.map(p => ({ externalId: p.externalId, contentType: p.contentType })),
      },
    })

    const cacheMap = new Map(cacheEntries.map(c => [`${c.contentType}:${c.externalId}`, c]))

    return preferences.map(p => {
      const cached = cacheMap.get(`${p.contentType}:${p.externalId}`)
      return {
        ...p,
        title: cached?.title ?? null,
        posterPath: cached?.posterPath ?? null,
        releaseYear: cached?.releaseYear ?? null,
      }
    })
  },

  async create(userId: string, data: { externalId: string; contentType: string; dislikeReason?: string | null }) {
    return prisma.userPreference.create({
      data: {
        userId,
        externalId: data.externalId,
        contentType: data.contentType,
        dislikeReason: data.dislikeReason,
      },
    })
  },

  async delete(id: string, userId: string) {
    return prisma.userPreference.deleteMany({
      where: { id, userId },
    })
  },
}
