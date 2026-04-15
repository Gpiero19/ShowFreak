import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PreferenceInput {
  externalId: string
  contentType: string
  dislikeReason?: string
}

export const preferencesService = {
  prisma,

  async create(userId: string, input: PreferenceInput): Promise<any> {
    return prisma.userPreference.create({
      data: {
        userId,
        externalId: input.externalId,
        contentType: input.contentType,
        dislikeReason: input.dislikeReason,
      },
    })
  },

  async getAll(userId: string): Promise<any[]> {
    return prisma.userPreference.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async delete(id: string, userId: string): Promise<void> {
    await prisma.userPreference.delete({
      where: { id, userId },
    })
  },

  async getById(id: string, userId: string): Promise<any> {
    return prisma.userPreference.findUnique({
      where: { id, userId },
    })
  },
}
