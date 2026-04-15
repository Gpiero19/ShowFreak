import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface LibraryItemInput {
  externalId: string
  contentType: string
  status: 'watched' | 'favorite' | 'wishlist'
  personalRating?: number
  notes?: string
  watchedAt?: Date
}

export interface LibraryQuery {
  userId: string
  status?: string
  contentType?: string
  search?: string
  genre?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export const libraryService = {
  prisma,

  async createItem(userId: string, input: LibraryItemInput): Promise<any> {
    const item = await prisma.libraryItem.create({
      data: {
        userId,
        externalId: input.externalId,
        contentType: input.contentType,
        status: input.status,
        personalRating: input.personalRating,
        notes: input.notes,
        watchedAt: input.watchedAt,
      },
      include: {
        contentCache: true,
      },
    })
    return item
  },

  async getItems(query: LibraryQuery): Promise<{ data: any[]; pagination: any }> {
    const { userId, status, contentType, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = query

    const where: any = { userId }
    if (status) where.status = status
    if (contentType) where.contentType = contentType
    if (search) {
      where.contentCache = {
        title: { contains: search, mode: 'insensitive' },
      }
    }

    const [items, total] = await Promise.all([
      prisma.libraryItem.findMany({
        where,
        include: {
          contentCache: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.libraryItem.count({ where }),
    ])

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async updateItem(id: string, userId: string, input: Partial<LibraryItemInput>): Promise<any> {
    const item = await prisma.libraryItem.update({
      where: { id, userId },
      data: {
        status: input.status,
        personalRating: input.personalRating,
        notes: input.notes,
        watchedAt: input.watchedAt,
      },
      include: {
        contentCache: true,
      },
    })
    return item
  },

  async deleteItem(id: string, userId: string): Promise<void> {
    await prisma.libraryItem.delete({
      where: { id, userId },
    })
  },

  async getItemById(id: string, userId: string): Promise<any> {
    return prisma.libraryItem.findUnique({
      where: { id, userId },
      include: {
        contentCache: true,
      },
    })
  },
}
