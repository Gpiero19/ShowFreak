# ShowFreak — Roadmap

## MVP: Complete

All 52 planned tasks are done. The full stack is implemented and tested.

### What's shipped

**Backend (Node.js + Express + PostgreSQL)**
- JWT auth (register, login, `/me`) with bcrypt, rate limiting, Helmet, CORS
- TMDB integration with singleton service, rate limit handling, and automatic content caching
- Full library CRUD with JOIN-based filtering (genre, status, type) and sorting (rating, release year, date added)
- User preferences (dislikes) with genre exclusion from recommendations
- Content-based recommendation engine (genre-weighted algorithm + "similar to" mode)
- Structured logging (pino), optional Sentry error monitoring, versioned Prisma migrations
- JWT refresh token flow with silent renewal

**Frontend (React 18 + Vite + TypeScript)**
- Auth flow: login, register, token persistence, auth-gated routing (no flicker)
- Home page: personalized recommendations or trending fallback
- Search page: debounced search, movie/TV filter, pagination
- Details page: full metadata, add-to-library actions, similar content
- Library page: multi-filter (status, genre, type) + multi-sort, title search
- Preferences page: manage dislikes, dislike from ContentCard / Library
- Toast notifications, loading states, error boundaries, responsive layout

**Testing**
- Backend: 81 passing integration tests across all endpoints (real DB)
- Frontend: 25 passing component/page unit tests

---

## Post-MVP Candidates

These are ordered roughly by user value. None are committed yet.

### Near-term

| Feature | Notes |
|---------|-------|
| **PreferencesPage — genre-based dislikes** | Current dislikes are content-level (by TMDB id). Adding genre-level dislikes would be more intuitive for users and more useful for recommendation filtering. |
| **"Continue watching" / progress tracking** | Episode/season progress for TV shows. Requires new DB columns on `library_items` (current_season, current_episode). |
| **User profile & settings page** | Change username, email, password. Currently no way to update account details after registration. |
| **Search within library — real-time** | The backend supports `?q=` but the frontend search UX could be improved (debounced inline filter vs. full-page query). |
| **Bulk library actions** | Select multiple items to update status, delete, or rate in one operation. |

### Medium-term

| Feature | Notes |
|---------|-------|
| **Improved recommendation algorithm** | Currently genre-weighted content-based. Could add recency decay, separate movie vs. TV preference weights, or "hidden gem" scoring (high vote_average, lower popularity). |
| **TV show season/episode detail** | TMDB has season and episode endpoints. Showing episode lists, per-episode watched tracking. |
| **Export library** | CSV or JSON export of the user's library. Simple but high value for data portability. |
| **Docker Compose setup** | Currently requires manual PostgreSQL setup. A `docker-compose.yml` for local dev would reduce onboarding friction. |
| **OpenAPI / Swagger docs** | Auto-generate API docs from Zod schemas. Useful if the API is ever consumed by third parties or a mobile client. |
| **Redis caching layer** | Replace in-DB TTL caching with Redis for recommendations and trending. Reduces Prisma read load. |

### Long-term / Exploratory

| Feature | Notes |
|---------|-------|
| **Social features** | Intentionally excluded from MVP. If added: friend lists, shared libraries, activity feed. Significant data model changes needed. |
| **Mobile app** | React Native or a PWA. The REST API is already mobile-ready. |
| **Collaborative lists** | Shared watchlists between users. Requires a new `lists` table and invite system. |
| **Streaming platform availability** | Show which platforms (Netflix, Prime, etc.) have the title. TMDB provides this via the `/watch/providers` endpoint. |
| **ML-based recommendations** | Currently rule-based. Could integrate a recommendation service (e.g., Surprise, LightFM) for collaborative filtering once there are enough users. |

---

## Technical Debt

| Item | Priority |
|------|----------|
| `src/` directory contains frontend root files (`index.html`, `vite.config.ts`) — ideally the frontend root should be at project root or a dedicated `frontend/` folder, not inside `src/`. Low priority unless repo structure becomes a pain point. | Low |
| No end-to-end tests (Playwright/Cypress). Integration tests cover the API; browser-level flows are untested. | Medium |
| TMDB cache expiry cleanup — expired rows in `content_cache` are never pruned. A periodic cleanup job (cron or pg_cron) would prevent unbounded table growth over time. | Low |
| `content_cache` stores `expires_at` but the app does not yet re-fetch stale entries on read — it only checks cache existence, not freshness. Staleness handling should be added to `tmdb.service.ts`. | Medium |
