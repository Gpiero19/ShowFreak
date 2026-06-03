import { beforeEach, afterAll } from 'vitest'
import { prisma } from '../../lib/prisma.js'

beforeEach(async () => {
  // Truncate in dependency order — CASCADE handles children
  await prisma.$executeRaw`TRUNCATE TABLE refresh_tokens, library_items, user_preferences, users, content_cache RESTART IDENTITY CASCADE`
})

afterAll(async () => {
  await prisma.$disconnect()
})
