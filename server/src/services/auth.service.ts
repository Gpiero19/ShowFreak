import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { config } from '../config/index.js'

interface User {
  id: string
  email: string
  passwordHash: string
  username: string
  createdAt: Date
}

export const authService = {
  async findUserByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    })
    if (!user) return null
    return { id: user.id, email: user.email, passwordHash: user.passwordHash, username: user.username, createdAt: user.createdAt }
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      username: user.username,
      createdAt: user.createdAt,
    }
  },

  async findUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      username: user.username,
      createdAt: user.createdAt,
    }
  },

  async createUser(email: string, password: string, username: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
      },
    })

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      username: user.username,
      createdAt: user.createdAt,
    }
  },

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash)
  },

  async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + config.jwt.refreshExpiresInMs)
    await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
    return token
  },

  async validateRefreshToken(token: string): Promise<string | null> {
    const record = await prisma.refreshToken.findUnique({ where: { token } })
    if (!record || record.expiresAt < new Date()) {
      if (record) await prisma.refreshToken.delete({ where: { token } })
      return null
    }
    return record.userId
  },

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } })
  },

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } })
  },
}
