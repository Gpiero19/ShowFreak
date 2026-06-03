import { Request, Response } from 'express'
import { z } from 'zod'
import { authService } from '../services/auth.service.js'
import { config } from '../config/index.js'
import { logger } from '../lib/logger.js'
import jwt from 'jsonwebtoken'

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  username: z.string().min(2, { message: 'Username must be at least 2 characters' }).max(100),
})

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
          code: 'VALIDATION_ERROR',
        })
      }

      const { email, password, username } = parsed.data

      const existingEmail = await authService.findUserByEmail(email)
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
          code: 'EMAIL_EXISTS',
        })
      }

      const existingUsername = await authService.findUserByUsername(username)
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken',
          code: 'USERNAME_TAKEN',
        })
      }

      const user = await authService.createUser(email, password, username)
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
          },
          token,
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Register error')
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
          code: 'VALIDATION_ERROR',
        })
      }

      const { email, password } = parsed.data

      const user = await authService.findUserByEmail(email)
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        })
      }

      const isValid = await authService.verifyPassword(password, user.passwordHash)
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        })
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
          },
          token,
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Login error')
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async me(req: Request, res: Response) {
    try {
      const authReq = req as { user?: { id: string; email: string } }
      const userId = authReq.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        })
      }

      const user = await authService.findUserById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        })
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Me error')
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}
