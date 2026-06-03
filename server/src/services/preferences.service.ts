import { prisma } from '../lib/prisma.js'

export const preferencesService = {
  async getAll(userId: string) {
    return prisma.userPreference.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
