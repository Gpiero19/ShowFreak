import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      code: 'NO_TOKEN',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; email: string }
    ;(req as AuthRequest).user = {
      id: decoded.userId,
      email: decoded.email,
    }
    next()
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    })
  }
}
