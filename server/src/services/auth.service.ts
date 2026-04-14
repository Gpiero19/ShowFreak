import bcrypt from 'bcrypt'

interface User {
  id: string
  email: string
  passwordHash: string
  username: string
  createdAt: Date
}

const mockUsers: User[] = []

export const authService = {
  async findUserByEmail(email: string): Promise<User | null> {
    return mockUsers.find((u) => u.email === email) || null
  },

  async createUser(email: string, password: string, username: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10)
    const user: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      username,
      createdAt: new Date(),
    }
    mockUsers.push(user)
    return user
  },

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash)
  },
}
