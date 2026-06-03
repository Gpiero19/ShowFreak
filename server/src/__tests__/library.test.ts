import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { createUser, createContentCache, createLibraryItem } from './helpers/fixtures.js'

describe('GET /api/library', () => {
  it('returns 200 with empty results for a new user', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .get('/api/library')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.data).toHaveLength(0)
    expect(res.body.data.pagination.total).toBe(0)
  })

  it('returns only the authenticated user\'s items, not other users\'', async () => {
    const { user: user1, token: token1 } = await createUser()
    const { token: token2 } = await createUser()

    const content = await createContentCache()
    await createLibraryItem(user1.id, content)

    // user1 sees their item
    const res1 = await request(app)
      .get('/api/library')
      .set('Authorization', `Bearer ${token1}`)
    expect(res1.body.data.data).toHaveLength(1)

    // user2 sees nothing
    const res2 = await request(app)
      .get('/api/library')
      .set('Authorization', `Bearer ${token2}`)
    expect(res2.body.data.data).toHaveLength(0)
  })

  it('filters by status', async () => {
    const { user, token } = await createUser()
    const c1 = await createContentCache()
    const c2 = await createContentCache()
    await createLibraryItem(user.id, c1, { status: 'watched' })
    await createLibraryItem(user.id, c2, { status: 'wishlist' })

    const res = await request(app)
      .get('/api/library?status=watched')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.data).toHaveLength(1)
    expect(res.body.data.data[0].status).toBe('watched')
  })

  it('filters by content type', async () => {
    const { user, token } = await createUser()
    const movie = await createContentCache({ contentType: 'movie' })
    const tv = await createContentCache({ contentType: 'tv' })
    await createLibraryItem(user.id, movie)
    await createLibraryItem(user.id, tv)

    const res = await request(app)
      .get('/api/library?type=movie')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.data).toHaveLength(1)
    expect(res.body.data.data[0].contentType).toBe('movie')
  })

  it('paginates results correctly', async () => {
    const { user, token } = await createUser()
    for (let i = 0; i < 3; i++) {
      const content = await createContentCache()
      await createLibraryItem(user.id, content)
    }

    const res = await request(app)
      .get('/api/library?page=2&limit=2')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.data).toHaveLength(1)
    expect(res.body.data.pagination.page).toBe(2)
    expect(res.body.data.pagination.total).toBe(3)
    expect(res.body.data.pagination.totalPages).toBe(2)
  })

  it('sorts by personal_rating descending', async () => {
    const { user, token } = await createUser()
    const c1 = await createContentCache()
    const c2 = await createContentCache()
    const c3 = await createContentCache()
    await createLibraryItem(user.id, c1, { personalRating: 3 })
    await createLibraryItem(user.id, c2, { personalRating: 5 })
    await createLibraryItem(user.id, c3, { personalRating: 1 })

    const res = await request(app)
      .get('/api/library?sort=personal_rating&order=desc')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const ratings = res.body.data.data.map((i: any) => i.personalRating)
    expect(ratings[0]).toBe(5)
    expect(ratings[ratings.length - 1]).toBe(1)
  })

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get('/api/library')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('NO_TOKEN')
  })
})

describe('POST /api/library', () => {
  it('returns 201 with the created library item including content data', async () => {
    const { user, token } = await createUser()
    const content = await createContentCache({ title: 'Inception', contentType: 'movie' })

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: content.externalId, contentType: 'movie', status: 'watched' })

    expect(res.status).toBe(201)
    expect(res.body.data.userId).toBe(user.id)
    expect(res.body.data.externalId).toBe(content.externalId)
    expect(res.body.data.status).toBe('watched')
    expect(res.body.data.title).toBe('Inception')
  })

  it('returns 201 with personalRating when provided', async () => {
    const { token } = await createUser()
    const content = await createContentCache()

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: content.externalId, contentType: content.contentType, status: 'watched', personalRating: 4 })

    expect(res.status).toBe(201)
    expect(res.body.data.personalRating).toBe(4)
  })

  it('returns 409 ALREADY_EXISTS when the item is already in the library', async () => {
    const { user, token } = await createUser()
    const content = await createContentCache()
    await createLibraryItem(user.id, content)

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: content.externalId, contentType: content.contentType, status: 'wishlist' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ALREADY_EXISTS')
  })

  it('returns 400 MISSING_FIELDS when externalId is absent', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'movie', status: 'watched' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('MISSING_FIELDS')
  })

  it('returns 400 INVALID_RATING for a rating above 5', async () => {
    const { token } = await createUser()
    const content = await createContentCache()

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: content.externalId, contentType: content.contentType, status: 'watched', personalRating: 6 })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_RATING')
  })

  it('returns 400 INVALID_RATING for a rating of 0', async () => {
    const { token } = await createUser()
    const content = await createContentCache()

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', `Bearer ${token}`)
      .send({ externalId: content.externalId, contentType: content.contentType, status: 'watched', personalRating: 0 })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_RATING')
  })

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .post('/api/library')
      .send({ externalId: '123', contentType: 'movie', status: 'watched' })

    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/library/:id', () => {
  it('returns 200 and updates status', async () => {
    const { user, token } = await createUser()
    const content = await createContentCache()
    const item = await createLibraryItem(user.id, content, { status: 'wishlist' })

    const res = await request(app)
      .patch(`/api/library/${item.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'watched' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('watched')
  })

  it('returns 200 and updates personalRating and notes', async () => {
    const { user, token } = await createUser()
    const content = await createContentCache()
    const item = await createLibraryItem(user.id, content)

    const res = await request(app)
      .patch(`/api/library/${item.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ personalRating: 5, notes: 'Masterpiece' })

    expect(res.status).toBe(200)
    expect(res.body.data.personalRating).toBe(5)
    expect(res.body.data.notes).toBe('Masterpiece')
  })

  it('returns 400 INVALID_RATING for a rating out of range', async () => {
    const { user, token } = await createUser()
    const content = await createContentCache()
    const item = await createLibraryItem(user.id, content)

    const res = await request(app)
      .patch(`/api/library/${item.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ personalRating: 7 })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_RATING')
  })

  it('returns 404 NOT_FOUND for a non-existent id', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .patch('/api/library/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'watched' })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 404 NOT_FOUND when attempting to update another user\'s item', async () => {
    const { user: owner } = await createUser()
    const { token: intruderToken } = await createUser()
    const content = await createContentCache()
    const item = await createLibraryItem(owner.id, content)

    const res = await request(app)
      .patch(`/api/library/${item.id}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({ status: 'favorite' })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/library/:id', () => {
  it('returns 204 and removes the item from the library', async () => {
    const { user, token } = await createUser()
    const content = await createContentCache()
    const item = await createLibraryItem(user.id, content)

    const deleteRes = await request(app)
      .delete(`/api/library/${item.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(deleteRes.status).toBe(204)

    // Confirm it is gone
    const getRes = await request(app)
      .get('/api/library')
      .set('Authorization', `Bearer ${token}`)
    expect(getRes.body.data.data).toHaveLength(0)
  })

  it('returns 404 NOT_FOUND for a non-existent id', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .delete('/api/library/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 404 NOT_FOUND when attempting to delete another user\'s item', async () => {
    const { user: owner } = await createUser()
    const { token: intruderToken } = await createUser()
    const content = await createContentCache()
    const item = await createLibraryItem(owner.id, content)

    const res = await request(app)
      .delete(`/api/library/${item.id}`)
      .set('Authorization', `Bearer ${intruderToken}`)

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})
