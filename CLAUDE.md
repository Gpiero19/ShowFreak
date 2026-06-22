# ShowFreak — Claude Code Guide

ShowFreak is a full-stack web app for discovering, tracking, and getting personalized recommendations for movies and TV shows. Users build a personal library (watched / favorites / wishlist), rate content, and receive genre-weighted recommendations via TMDB.

---

## Dev Commands

```bash
npm run dev              # Start both servers (frontend :5173, backend :3001)
npm run dev:frontend     # Vite dev server only
npm run dev:backend      # Express dev server only
npm run build            # Build both workspaces
npm run test             # Run all tests (backend + frontend)
npm run test:backend     # Vitest integration tests in server/
npm run test:frontend    # Vitest unit tests in src/
npm run typecheck        # tsc --noEmit on both workspaces
npm run lint             # ESLint on both workspaces
npm run clean:ports      # Kill processes on :3000 :3001 :5173 :5174
```

Backend tests require a real PostgreSQL test database (see `server/.env.test`). Do not mock Prisma — tests proved mock/prod divergence causes silent failures.

---

## Project Structure

```
showfreak/
├── src/                         # Frontend — React 18 + Vite + TypeScript
│   ├── components/
│   │   ├── search/ContentCard.tsx
│   │   └── Navbar.tsx
│   ├── pages/                   # HomePage, SearchPage, DetailsPage, LibraryPage,
│   │                            # AuthPage, NotFoundPage
│   ├── hooks/                   # useLibrary, useLibraryItem, useLibraryMutations,
│   │                            # usePreferences, usePreferenceMutations, useRecommendations
│   ├── services/api.ts          # Axios instance + JWT interceptors
│   ├── context/AuthContext.tsx  # JWT stored in localStorage, silent renewal
│   └── types/index.ts           # All shared TypeScript interfaces/enums
│
├── server/                      # Backend — Node.js 20 + Express + TypeScript (ESM)
│   ├── src/
│   │   ├── app.ts / server.ts
│   │   ├── routes/              # auth, content, library, preferences, recommendations
│   │   ├── controllers/         # thin — delegate to services
│   │   ├── services/            # auth, tmdb, recommendation, library, preferences
│   │   ├── middleware/          # auth.middleware.ts (JWT), rate limiting, Helmet, CORS
│   │   ├── lib/                 # prisma.ts (singleton), tmdb.ts (singleton), logger.ts (pino)
│   │   └── config/index.ts      # validates all required env vars at startup
│   └── prisma/schema.prisma
│
├── CLAUDE.md
├── roadmap.md
└── package.json                 # npm workspaces: ["src", "server"]
```

---

## Coding Rules

- **TypeScript strict** — no `any`. All types live in `src/types/index.ts` (frontend) or inline in `server/src/`.
- **Naming:** camelCase vars/functions, PascalCase components/classes/interfaces, UPPER_SNAKE_CASE constants.
- **ESM imports:** use `.js` extension in local server imports (e.g., `import { prisma } from './lib/prisma.js'`).
- **No comments on obvious code** — only add one when the WHY is non-obvious.
- **Error handling:** all async functions use try/catch; never silently fail. Backend returns `{ success: false, error: string, code: string }`.
- **No N+1 queries** — library operations always JOIN `library_items` with `content_cache`.
- **No hardcoded secrets** — all config via `server/src/config/index.ts` which enforces required env vars.

---

## Critical Architecture Invariants

**Content Cache Pattern**
All TMDB metadata is stored in `content_cache` on first fetch. Library queries never call TMDB — they JOIN with the local cache. Cache TTLs: search 15 min, details 24 h, trending 1 h, recommendations 1 h.

**Library JOIN Query**
Every library listing must join `library_items` with `content_cache` for filtering, sorting, and title search:
```sql
SELECT li.*, cc.title, cc.poster_path, cc.vote_average, cc.release_year, cc.genres
FROM library_items li
JOIN content_cache cc ON li.external_id = cc.external_id
WHERE li.user_id = $1
  AND ($2 IS NULL OR li.status = $2)
  AND ($3 IS NULL OR cc.genres @> $3::jsonb)
  AND ($4 IS NULL OR cc.title ILIKE '%' || $4 || '%')
```

**Recommendation Weights**
Genre weights: 5★ = 3 pts, 4★ = 2 pts, 3★ = 1 pt, unrated = 0.5 pts. Top 3 genres after excluding user dislikes are sent to TMDB discover endpoint. Falls back to trending when library is empty.

**Singletons**
`server/src/lib/prisma.ts` and `server/src/lib/tmdb.ts` export shared singletons. Never instantiate `PrismaClient` or `TMDBService` directly in services.

**Unique constraints**
`library_items(user_id, external_id)` is UNIQUE — adding a duplicate returns 409. `users.username` is UNIQUE at DB level.

**API contracts are frozen** — do not change response shapes for existing endpoints without updating all callers.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | `{ email, password, username }` → `{ user, token }` |
| POST | `/api/auth/login` | — | `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/content/search` | — | `?q=&type=movie\|tv&page=&limit=` |
| GET | `/api/content/:id` | — | `?type=movie\|tv` — full details |
| GET | `/api/content/:id/similar` | — | `?type=&limit=` |
| GET | `/api/library` | JWT | `?page&limit&sort&order&q&genre&status&type` |
| POST | `/api/library` | JWT | `{ externalId, contentType, status }` |
| PATCH | `/api/library/:id` | JWT | `{ status?, personalRating?, notes?, watchedAt? }` |
| DELETE | `/api/library/:id` | JWT | 204 |
| GET | `/api/preferences` | JWT | User dislikes |
| POST | `/api/preferences` | JWT | `{ externalId, contentType, dislikeReason? }` |
| DELETE | `/api/preferences/:id` | JWT | 204 |
| GET | `/api/recommendations` | JWT | `?limit=` or `?based_on=id&type=` |

All list responses: `{ success: true, data: { data: T[], pagination: { page, limit, total, totalPages } } }`

---

## Database Schema (Prisma models)

| Table | Key columns |
|-------|-------------|
| `users` | `id UUID PK`, `email UNIQUE`, `password_hash`, `username UNIQUE` |
| `content_cache` | `external_id PK`, `content_type`, `title`, `poster_path`, `vote_average`, `release_year`, `genres JSONB`, `expires_at` |
| `library_items` | `id UUID PK`, `user_id FK`, `external_id FK→content_cache`, `status (watched\|favorite\|wishlist)`, `personal_rating (1-5)`, `notes`, `watched_at` — UNIQUE(user_id, external_id) |
| `user_preferences` | `id UUID PK`, `user_id FK`, `external_id`, `content_type`, `dislike_reason` |

GIN index on `content_cache.genres` for JSONB array queries (`@>`).

---

## Environment Variables

```bash
# server/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/showfreak"
JWT_SECRET="min-32-char-secret"
JWT_EXPIRES_IN="7d"
TMDB_API_KEY="your-tmdb-api-key"
TMDB_BASE_URL="https://api.themoviedb.org/3"
TMDB_IMAGE_BASE="https://image.tmdb.org/t/p"
PORT=3001
NODE_ENV=development
ALLOWED_ORIGIN="http://localhost:5173"
SENTRY_DSN=""          # optional — leave empty to disable Sentry
```

```bash
# src/.env (frontend)
VITE_API_URL="http://localhost:3001"
```

---

## Known Gotchas

- **`content_cache.genres` stores genre IDs (integers), not names.** The recommendation algorithm passes IDs to TMDB discover. The details endpoint returns names separately to the frontend. If genres were stored as names, recommendations return zero results.
- **Prisma composite key upserts:** `content_cache` uses `@@unique([externalId, contentType])`. Upsert `where` must be `{ externalId_contentType: { externalId, contentType } }`.
- **Prisma Decimal → Number:** `vote_average` comes back as a Prisma `Decimal` object. Always convert with `Number(val)` before sending to the frontend.
- **Prisma JSONB → string[]:** `genres` comes back as `JsonValue`. Cast with `(val as string[])` after confirming it's an array.
- **Axios baseURL:** `src/services/api.ts` sets `baseURL: '/api'`. Service calls must use paths without the `/api` prefix (e.g., `/library`, not `/api/library`).
- **TanStack Query invalidation:** After any library/preferences mutation, invalidate `['library']`, `['recommendations']`, and `['preferences']` query keys or the UI will show stale data.

---

## Testing

Backend tests are integration tests that hit a real PostgreSQL test database (`server/.env.test`). Each test suite cleans up its own data. Test helpers and fixtures are in `server/src/__tests__/helpers/`.

Frontend tests use Vitest + React Testing Library. Component tests mock API calls via `vi.mock`.

Run `npm run typecheck` and `npm run lint` before committing.
