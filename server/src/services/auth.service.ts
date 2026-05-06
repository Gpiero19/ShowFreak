import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface User {
  id: string
  email: string
  passwordHash: string
  username: string
  createdAt: Date
}

export const authService = {
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
}
