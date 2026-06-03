import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { createUser } from './helpers/fixtures.js'

describe('POST /api/auth/register', () => {
  it('returns 201 with user, token, and refreshToken on valid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123', username: 'newuser' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.email).toBe('new@example.com')
    expect(res.body.data.user.username).toBe('newuser')
    expect(res.body.data.user.passwordHash).toBeUndefined()
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.refreshToken).toBeTruthy()
  })

  it('returns 400 VALIDATION_ERROR for an invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', username: 'testuser' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 VALIDATION_ERROR for a password under 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'short', username: 'testuser' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 VALIDATION_ERROR for a username under 2 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', username: 'x' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 EMAIL_EXISTS for a duplicate email', async () => {
    await createUser({ email: 'existing@example.com', username: 'existinguser' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@example.com', password: 'password123', username: 'differentuser' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('EMAIL_EXISTS')
  })

  it('returns 400 USERNAME_TAKEN for a duplicate username', async () => {
    await createUser({ email: 'first@example.com', username: 'takenuser' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'second@example.com', password: 'password123', username: 'takenuser' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('USERNAME_TAKEN')
  })
})

describe('POST /api/auth/login', () => {
  it('returns 200 with user, token, and refreshToken on valid credentials', async () => {
    await createUser({ email: 'login@example.com', password: 'mypassword', username: 'loginuser' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'mypassword' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.refreshToken).toBeTruthy()
    expect(res.body.data.user.email).toBe('login@example.com')
    expect(res.body.data.user.passwordHash).toBeUndefined()
  })

  it('returns 401 INVALID_CREDENTIALS for an unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 401 INVALID_CREDENTIALS for a wrong password', async () => {
    await createUser({ email: 'wrongpass@example.com', username: 'wrongpassuser' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'thisiswrong' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 400 VALIDATION_ERROR for a malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-valid', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/auth/refresh', () => {
  it('returns 200 with a new token and rotated refreshToken', async () => {
    const { refreshToken } = await createUser()

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.refreshToken).toBeTruthy()
    expect(res.body.data.refreshToken).not.toBe(refreshToken)
  })

  it('returns 401 INVALID_TOKEN for an unknown refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'made-up-garbage-token' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_TOKEN')
  })

  it('returns 401 NO_TOKEN when refreshToken is absent', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({})

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('NO_TOKEN')
  })

  it('rejects the old refresh token after rotation', async () => {
    const { refreshToken } = await createUser()

    // First use succeeds
    await request(app).post('/api/auth/refresh').send({ refreshToken })

    // Old token is now revoked
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_TOKEN')
  })
})

describe('POST /api/auth/logout', () => {
  it('returns 204 and invalidates the refresh token', async () => {
    const { refreshToken } = await createUser()

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken })
    expect(logoutRes.status).toBe(204)

    // Token is now dead
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
    expect(refreshRes.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 200 with user data on a valid access token', async () => {
    const { user, token } = await createUser()

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(user.id)
    expect(res.body.data.email).toBe(user.email)
    expect(res.body.data.username).toBe(user.username)
    expect(res.body.data.passwordHash).toBeUndefined()
  })

  it('returns 401 NO_TOKEN with no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('NO_TOKEN')
  })

  it('returns 401 INVALID_TOKEN with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.garbage')

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_TOKEN')
  })
})
