import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'
import { createUser, createContentCache } from './helpers/fixtures.js'

describe('GET /api/preferences', () => {
  it('returns 200 with an empty array for a new user', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(0)
  })

  it('returns preferences enriched with title and posterPath from content_cache', async () => {
    const { user, token } = await createUser()
    const content = await createContentCache({
      externalId: '77777',
      contentType: 'movie',
      title: 'Dune',
    })

    await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: content.externalId, contentType: content.contentType })

    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].externalId).toBe('77777')
    expect(res.body.data[0].title).toBe('Dune')
    expect(res.body.data[0].posterPath).toBeTruthy()
  })

  it('returns null for title and posterPath when content is not in cache', async () => {
    const { user, token } = await createUser()

    // Insert preference directly — no matching content_cache entry
    await prisma.userPreference.create({
      data: {
        userId: user.id,
        externalId: 'uncached-999',
        contentType: 'movie',
      },
    })

    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data[0].title).toBeNull()
    expect(res.body.data[0].posterPath).toBeNull()
  })

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get('/api/preferences')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('NO_TOKEN')
  })
})

describe('POST /api/preferences', () => {
  it('returns 201 and creates a preference', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: '12345', contentType: 'movie' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.externalId).toBe('12345')
    expect(res.body.data.contentType).toBe('movie')
  })

  it('returns 201 and stores an optional dislikeReason', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: '12346', contentType: 'tv', dislikeReason: 'too_long' })

    expect(res.status).toBe(201)
    expect(res.body.data.dislikeReason).toBe('too_long')
  })

  it('returns 409 DUPLICATE_PREFERENCE for the same externalId and contentType', async () => {
    const { token } = await createUser()

    await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: '55555', contentType: 'movie' })

    const res = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: '55555', contentType: 'movie' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('DUPLICATE_PREFERENCE')
  })

  it('returns 400 MISSING_FIELDS when externalId is absent', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'movie' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('MISSING_FIELDS')
  })

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .post('/api/preferences')
      .send({ externalId: '999', contentType: 'movie' })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/preferences/:id', () => {
  it('returns 204 and removes the preference', async () => {
    const { token } = await createUser()

    const createRes = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: '88888', contentType: 'movie' })

    const prefId = createRes.body.data.id

    const deleteRes = await request(app)
      .delete(`/api/preferences/${prefId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(deleteRes.status).toBe(204)

    // Confirm gone
    const getRes = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${token}`)
    expect(getRes.body.data).toHaveLength(0)
  })

  it('returns 204 but makes no change when targeting another user\'s preference', async () => {
    const { token: ownerToken } = await createUser()
    const { token: intruderToken } = await createUser()

    const createRes = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ externalId: '99999', contentType: 'tv' })

    const prefId = createRes.body.data.id

    // Intruder attempts deletion — 204 with no error, but nothing deleted
    const deleteRes = await request(app)
      .delete(`/api/preferences/${prefId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
    expect(deleteRes.status).toBe(204)

    // Owner's preference still exists
    const getRes = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${ownerToken}`)
    expect(getRes.body.data).toHaveLength(1)
  })
})
