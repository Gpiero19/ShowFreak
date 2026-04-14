import { Router, Request, Response } from 'express'
import { authService } from '../services/auth.service.js'
import { config } from '../config/index.js'
import jwt from 'jsonwebtoken'

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, username } = req.body
      
      const existingUser = await authService.findUserByEmail(email)
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
          code: 'EMAIL_EXISTS',
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
      console.error('Register error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

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
      console.error('Login error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },

  async me(req: Request, res: Response) {
    try {
      const user = (req as any).user
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
      console.error('Me error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      })
    }
  },
}
