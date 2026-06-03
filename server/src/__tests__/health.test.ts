import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('health', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('GET /api/unknown returns 404', async () => {
    const res = await request(app).get('/api/unknown')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})
