import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import contentRoutes from './routes/content.routes.js'
import libraryRoutes from './routes/library.routes.js'
import preferencesRoutes from './routes/preferences.routes.js'
import recommendationsRoutes from './routes/recommendations.routes.js'

const app: Application = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/preferences', preferencesRoutes)
app.use('/api/recommendations', recommendationsRoutes)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  })
})

export default app
