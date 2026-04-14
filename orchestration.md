# ShowFreak - Multi-Agent Orchestration System (HARDENED)

This document defines a production-grade orchestration system for executing the ShowFreak project using multiple AI agents in parallel with git worktrees.

---

## ENFORCEMENT RULES

### 1. TASK STATE MACHINE (STRICT)

Tasks MUST follow this state machine:

```
TODO → IN_PROGRESS → DONE
```

| State | Who Can Change | Rule |
|-------|---------------|------|
| TODO | Orchestrator only | Initial state, unassigned |
| IN_PROGRESS | Agent (when starting) | Agent picks task, marks locally |
| DONE | Orchestrator only | After commit verified, dependencies satisfied |

**State Transition Rules:**
- Agent CANNOT mark task DONE directly
- Agent MUST commit before requesting DONE status
- Orchestrator VERIFIES commit exists, then marks DONE
- No task can transition to IN_PROGRESS if dependencies are not DONE

---

### 2. API CONTRACT FREEZE RULE

**Trigger:** After AUTH-07 (all auth endpoints complete) is marked DONE by Orchestrator

**Rules After Freeze:**
- All API endpoints defined in design.md become IMMUTABLE
- Response structures CANNOT change
- Request/response types CANNOT change
- If change needed: NEW task required + Orchestrator approval

**Frozen Contracts:**
- /api/auth/register, /api/auth/login, /api/auth/me
- /api/content/search, /api/content/:id, /api/content/:id/similar
- /api/library (all methods)
- /api/preferences (all methods)
- /api/recommendations (all methods)

**Validation:** Frontend Builder CANNOT proceed beyond FE-11 until API Freeze confirmed by Orchestrator.

---

### 3. FILE OWNERSHIP PER TASK (MANDATORY)

Every task MUST define:
- **Allowed Files:** Explicit paths or directory scope
- **Forbidden Files:** Explicit paths or patterns

**Enforcement:** Agent violates rules if touching Forbidden Files → Rollback + Warning

---

### 4. SYSTEM COMPLETION DEFINITION

System is DONE when ALL of these are true:

1. All 52 tasks marked DONE by Orchestrator
2. Backend worktree merged to main
3. Frontend worktree merged to main
4. All INT tasks pass (API integration verified)
5. All POL tasks pass (quality gates met)
6. No TODO tasks remaining in .kilo/tasks.json
7. All endpoints respond correctly (health check)

---

## 1. AGENT ROLES

### ORCHESTRATOR AGENT

**Responsibilities:**
- Coordinate task execution across all agents
- Manage dependencies and unlock tasks
- Monitor progress and resolve conflicts
- Create git worktrees for each sub-agent
- Merge completed worktrees back to main

**Allowed Files:**
- All files in all worktrees
- `.kilo/` directory for orchestration metadata

**Forbidden Actions:**
- Cannot write business logic code directly
- Cannot modify architecture/design documents

**Commit Rules:**
- Commits only for orchestration metadata
- Message format: `chore: [orchestration action]`

---

### BACKEND BUILDER AGENT

**Responsibilities:**
- Implement all backend services, controllers, routes, middleware
- Configure Prisma schema and run migrations
- Implement authentication (JWT)
- Integrate with TMDB API
- Implement content caching system
- Implement library, preferences, and recommendation services
- Ensure all endpoints return standardized JSON responses

**Allowed Files:**
- `server/` directory (all subdirectories)
- `prisma/` directory
- `.env` configuration files
- `package.json` and `package-lock.json`

**Forbidden Actions:**
- Cannot modify frontend code
- Cannot change database type (PostgreSQL only)
- Cannot remove required environment variables

**Commit Rules:**
- Must commit after each atomic task
- Message format: `backend: [task-id] - [brief description]`
- Must include task ID in commit message

---

### FRONTEND BUILDER AGENT

**Responsibilities:**
- Implement all React pages and components
- Configure TanStack Query and API client
- Implement authentication flow (login/register)
- Create all UI components (Button, Input, Card, etc.)
- Implement library management UI with filters/sort
- Implement search and details pages
- Implement recommendations display

**Allowed Files:**
- `src/` directory (all subdirectories)
- `index.html`, `vite.config.ts`
- `package.json` and `package-lock.json`

**Forbidden Actions:**
- Cannot modify backend code
- Cannot change React to another framework
- Cannot remove TanStack Query

**Commit Rules:**
- Must commit after each atomic task
- Message format: `frontend: [task-id] - [brief description]`
- Must include task ID in commit message

---

### INTEGRATION AGENT (RESTRICTED)

**Responsibilities:**
- Connect frontend to backend
- Test full user flows (register→login→search→add library)
- Test library filtering and sorting
- Test recommendations
- Verify responsive design
- **RESTRICTED: Cannot modify backend business logic**
- **RESTRICTED: Can only do frontend-only UI fixes (loading states, error handling)**

**Allowed Files (NARROW):**
- `src/` (frontend only, for UI fixes)
- Can run curl/Postman tests against backend
- Can read backend code for test purposes only

**Forbidden Actions:**
- **CANNOT modify backend business logic** (services, controllers, routes)
- **CANNOT change API contracts**
- **CANNOT modify database schema**
- **CANNOT change Prisma models**
- **CANNOT touch TMDB integration code**

**Allowed Frontend-Only Fixes:**
- Add loading spinners (FE-08 derived)
- Add error boundaries
- Fix CSS/layout issues
- Add responsive breakpoints
- Fix toast notifications

**Commit Rules:**
- Must commit after each test flow
- Message format: `integration: [task-id] - [brief description]`

---

## 2. WORKTREE STRUCTURE

### Git Worktree Setup

```bash
# Main repository (main branch)
# Location: /Users/giancanevari/Documents/GitHub/ShowFreak

# Backend worktree (explicit name: backend)
git worktree add ../backend -b backend
# Location: /Users/giancanevari/Documents/GitHub/backend

# Frontend worktree (explicit name: frontend)
git worktree add ../frontend -b frontend
# Location: /Users/giancanevari/Documents/GitHub/frontend
```

### Worktree Assignment

| Worktree | Branch | Agent | Active Tasks |
|----------|--------|-------|--------------|
| main | main | Orchestrator | Coordination, merging |
| backend | backend | Backend Builder | INF, AUTH, TMDB, CONTENT, LIB, PREF, REC |
| frontend | frontend | Frontend Builder | FE-01 through FE-21 |
| - | - | Integration Agent | INT-01 through POL-04 |

### Worktree Initialization Commands

```bash
# Create backend worktree (explicit name: backend)
cd /Users/giancanevari/Documents/GitHub/ShowFreak
git worktree add ../backend -b backend

# Create frontend worktree (explicit name: frontend)
git worktree add ../frontend -b frontend
```

---

## 3. TASK SYSTEM (UPDATED)

### Task Template (MANDATORY for ALL tasks)

```markdown
#### Task [ID]: [Title]
- **Description:** [What to do]
- **Owner:** [Agent Name]
- **Worktree:** [backend|frontend|both]
- **State:** TODO | IN_PROGRESS | DONE
- **Dependencies:** [List of task IDs that must be DONE]
- **Allowed Files:**
  - [Explicit file paths or directory scopes]
- **Forbidden Files:**
  - [Explicit file paths or patterns]
- **Expected Outputs:** [Exact files created/modified]
- **Constraints:** [Libraries, architecture rules, behavior rules]
- **Definition of DONE:** [Specific criteria for completion]
- **Commit Message:** `[agent]: [task-id] - [brief description]`
```

---

### Phase 1: Infrastructure Setup

#### Task INF-01: Initialize Node.js Backend Project
- **Description:** Create Node.js project with TypeScript, initialize npm, create tsconfig.json
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** None
- **Allowed Files:**
  - `server/package.json`
  - `server/tsconfig.json`
  - `server/.gitignore`
- **Forbidden Files:**
  - Any file outside server/ directory
- **Expected Outputs:**
  - `server/package.json`
  - `server/tsconfig.json`
  - `server/.gitignore`
- **Constraints:** Use Node.js 20+, TypeScript strict mode enabled
- **Definition of DONE:** `npm init` succeeds, TypeScript compiles without errors
- **Commit Message:** `backend: INF-01 - Initialize Node.js project with TypeScript`

#### Task INF-02: Install Backend Dependencies
- **Description:** Install express, prisma, jsonwebtoken, bcrypt, zod, cors, dotenv
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** INF-01
- **Allowed Files:**
  - `server/package.json`
  - `server/package-lock.json`
  - `server/node_modules/`
- **Forbidden Files:**
  - Any source code files (no .ts/.tsx modifications)
- **Expected Outputs:** `server/node_modules/`, `server/package-lock.json`
- **Constraints:** Use latest stable versions compatible with Node.js 20+
- **Definition of DONE:** All packages installed, no security warnings
- **Commit Message:** `backend: INF-02 - Install backend dependencies`

#### Task INF-03: Create PostgreSQL Database
- **Description:** Create PostgreSQL database "showfreak"
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** None (external)
- **Allowed Files:** None (database operation)
- **Forbidden Files:** None
- **Expected Outputs:** Database exists, connection tested
- **Constraints:** Use configured database URL from .env
- **Definition of DONE:** `psql -c "SELECT 1 FROM showfreak"` succeeds
- **Commit Message:** `backend: INF-03 - Create PostgreSQL database`

#### Task INF-04: Configure Prisma Schema
- **Description:** Create prisma/schema.prisma with all models (User, ContentCache, LibraryItem, UserPreference)
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** INF-02
- **Allowed Files:**
  - `server/prisma/schema.prisma`
- **Forbidden Files:**
  - Any code outside prisma/
- **Expected Outputs:** `server/prisma/schema.prisma`
- **Constraints:** Must match architecture.md schema exactly, use UUIDs, proper indexes
- **Definition of DONE:** Schema validates, `npx prisma validate` passes
- **Commit Message:** `backend: INF-04 - Configure Prisma schema with all models`

#### Task INF-05: Run Prisma Migration
- **Description:** Execute prisma migrate and generate prisma client
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** INF-04, INF-03
- **Allowed Files:**
  - `server/prisma/migrations/`
  - `server/node_modules/.prisma/`
- **Forbidden Files:** None
- **Expected Outputs:** `server/prisma/migrations/`, `server/node_modules/.prisma/`
- **Constraints:** Migration must succeed without errors
- **Definition of DONE:** `npx prisma migrate dev` and `npx prisma generate` both pass
- **Commit Message:** `backend: INF-05 - Run Prisma migration and generate client`

#### Task INF-06: Configure Environment Variables
- **Description:** Create .env with DATABASE_URL, JWT_SECRET, TMDB_API_KEY
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** INF-01
- **Allowed Files:**
  - `server/.env`
  - `.env.example`
- **Forbidden Files:** None
- **Expected Outputs:** `server/.env` (template), `.env.example`
- **Constraints:** JWT_SECRET minimum 32 characters, TMDB_API_KEY required
- **Definition of DONE:** .env file exists with all required variables
- **Commit Message:** `backend: INF-06 - Configure environment variables`

#### Task INF-07: Create Express App Structure
- **Description:** Create server/src/app.ts and server/src/server.ts with Express setup
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** INF-02
- **Allowed Files:**
  - `server/src/app.ts`
  - `server/src/server.ts`
- **Forbidden Files:**
  - Any controller, service, route files
- **Expected Outputs:** `server/src/app.ts`, `server/src/server.ts`
- **Constraints:** Configure CORS, JSON parsing, error handling middleware
- **Definition of DONE:** Server starts on port 3001, responds to health check
- **Commit Message:** `backend: INF-07 - Create Express app structure`

---

### Phase 2: Core Backend Services

#### Task AUTH-01: Create Auth Middleware
- **Description:** Implement JWT verification middleware in server/src/middleware/auth.middleware.ts
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** INF-07
- **Expected Outputs:** `server/src/middleware/auth.middleware.ts`
- **Constraints:** Verify JWT from Authorization header, extract userId and email
- **Definition of DONE:** Middleware correctly validates valid/invalid tokens
- **Commit Message:** `backend: AUTH-01 - Create auth middleware (JWT verification)`

#### Task AUTH-02: Create Auth Service
- **Description:** Implement auth service with register, login, password hashing in server/src/services/auth.service.ts
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** AUTH-01
- **Expected Outputs:** `server/src/services/auth.service.ts`
- **Constraints:** Use bcrypt for hashing, JWT payload: { userId, email }
- **Definition of DONE:** Service methods work correctly, tests pass
- **Commit Message:** `backend: AUTH-02 - Create auth service (register, login)`

#### Task AUTH-03: Create Auth Controller
- **Description:** Implement auth controller with request/response handling
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** AUTH-02
- **Expected Outputs:** `server/src/controllers/auth.controller.ts`
- **Constraints:** Return standardized JSON { success, data/error }
- **Definition of DONE:** Controller handles all auth scenarios
- **Commit Message:** `backend: AUTH-03 - Create auth controller`

#### Task AUTH-04: Create Auth Routes
- **Description:** Define Express routes for /api/auth/register, /api/auth/login, /api/auth/me
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** AUTH-03
- **Expected Outputs:** `server/src/routes/auth.routes.ts`
- **Constraints:** Routes must be mounted at /api/auth prefix
- **Definition of DONE:** All routes defined and mounted
- **Commit Message:** `backend: AUTH-04 - Create auth routes`

#### Task AUTH-05: Implement Register Endpoint
- **Description:** Implement /api/auth/register endpoint with input validation (Zod)
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** AUTH-04
- **Expected Outputs:** Working register endpoint
- **Constraints:** Validate: email (valid), password (min 8), username (3-30 alphanumeric)
- **Definition of DONE:** Returns 201 with { user, token } on success, 400 on validation error
- **Commit Message:** `backend: AUTH-05 - Implement register endpoint`

#### Task AUTH-06: Implement Login Endpoint
- **Description:** Implement /api/auth/login endpoint
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** AUTH-04
- **Expected Outputs:** Working login endpoint
- **Constraints:** Return 401 on invalid credentials
- **Definition of DONE:** Returns 200 with { user, token } on success
- **Commit Message:** `backend: AUTH-06 - Implement login endpoint`

#### Task AUTH-07: Implement /api/auth/me Endpoint
- **Description:** Implement /api/auth/me to get current user
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** AUTH-04
- **Allowed Files:** Auth route integration (no new files)
- **Forbidden Files:** None
- **Expected Outputs:** Working /api/auth/me endpoint
- **Definition of DONE:** Returns current user data with valid JWT
- **Commit Message:** `backend: AUTH-07 - Implement /api/auth/me endpoint`

**⚠️ API CONTRACT FREEZE TRIGGER: After AUTH-07 DONE, all API contracts become IMMUTABLE**

#### Task TMDB-01: Create TMDB Service
- **Description:** Implement TMDB service with search, details, similar, discover, trending methods
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** AUTH-01
- **Allowed Files:**
  - `server/src/services/tmdb.service.ts`
- **Forbidden Files:** Any controller files
- **Expected Outputs:** `server/src/services/tmdb.service.ts`
- **Constraints:** Use TMDB API v3, handle all response types
- **Definition of DONE:** All TMDB API methods implemented
- **Commit Message:** `backend: TMDB-01 - Create TMDB service`

#### Task TMDB-02: Implement Automatic Content Caching
- **Description:** Add caching logic to store TMDB responses in content_cache table
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** TMDB-01, INF-04
- **Allowed Files:** Modified `server/src/services/tmdb.service.ts`
- **Forbidden Files:** None
- **Expected Outputs:** Modified tmdb.service.ts with cache integration
- **Constraints:** Cache expires in 30 days, use upsert for updates
- **Definition of DONE:** Content automatically cached when fetched
- **Commit Message:** `backend: TMDB-02 - Implement automatic content caching`

#### Task TMDB-03: Add TMDB Rate Limit Handling
- **Description:** Implement rate limit handling for TMDB API (max 40 req/sec)
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **State:** TODO
- **Dependencies:** TMDB-01
- **Allowed Files:** Modified `server/src/services/tmdb.service.ts`
- **Forbidden Files:** None
- **Expected Outputs:** Rate limiting logic in tmdb.service.ts
- **Constraints:** Follow TMDB rate limit headers (Retry-After)
- **Definition of DONE:** No 429 errors from TMDB
- **Commit Message:** `backend: TMDB-03 - Add TMDB rate limit handling`

---

### Phase 3: Content & Library Features

#### Task CONTENT-01: Create Content Service
- **Description:** Implement content service wrapping TMDB with caching
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** TMDB-01
- **Expected Outputs:** `server/src/services/content.service.ts`
- **Definition of DONE:** Service provides cached content data
- **Commit Message:** `backend: CONTENT-01 - Create content service`

#### Task CONTENT-02: Create Content Controller
- **Description:** Implement content controller with request/response handling
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** CONTENT-01
- **Expected Outputs:** `server/src/controllers/content.controller.ts`
- **Definition of DONE:** Controller handles all content endpoints
- **Commit Message:** `backend: CONTENT-02 - Create content controller`

#### Task CONTENT-03: Implement /api/content/search Endpoint
- **Description:** Implement GET /api/content/search?q=&type=&page=&limit=
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** CONTENT-02
- **Expected Outputs:** Working search endpoint
- **Constraints:** Support type=movie|tv filter, pagination, cache results
- **Definition of DONE:** Returns paginated search results
- **Commit Message:** `backend: CONTENT-03 - Implement /api/content/search endpoint`

#### Task CONTENT-04: Implement /api/content/:id Endpoint
- **Description:** Implement GET /api/content/:id?type=
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** CONTENT-02
- **Expected Outputs:** Working content details endpoint
- **Definition of DONE:** Returns full content details with cached metadata
- **Commit Message:** `backend: CONTENT-04 - Implement /api/content/:id endpoint`

#### Task CONTENT-05: Implement /api/content/:id/similar Endpoint
- **Description:** Implement GET /api/content/:id/similar?type=&limit=
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** CONTENT-02
- **Expected Outputs:** Working similar content endpoint
- **Definition of DONE:** Returns similar content list
- **Commit Message:** `backend: CONTENT-05 - Implement /api/content/:id/similar endpoint`

#### Task LIB-01: Create Library Service
- **Description:** Implement library service with CRUD, filtering, sorting using JOIN with content_cache
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** INF-04, CONTENT-01
- **Expected Outputs:** `server/src/services/library.service.ts`
- **Constraints:** Support filters: q, genre, status, type; sort: created_at, personal_rating, vote_average, release_year, title
- **Definition of DONE:** Service handles all library operations with JOIN queries
- **Commit Message:** `backend: LIB-01 - Create library service`

#### Task LIB-02: Create Library Controller
- **Description:** Implement library controller with request/response handling
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** LIB-01
- **Expected Outputs:** `server/src/controllers/library.controller.ts`
- **Definition of DONE:** Controller handles all library endpoints
- **Commit Message:** `backend: LIB-02 - Create library controller`

#### Task LIB-03: Implement GET /api/library
- **Description:** Implement GET /api/library with all query parameters
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** LIB-02
- **Expected Outputs:** Working library listing endpoint
- **Constraints:** Must join with content_cache for filtering/sorting
- **Definition of DONE:** Returns paginated library with filters/sort working
- **Commit Message:** `backend: LIB-03 - Implement GET /api/library endpoint`

#### Task LIB-04: Implement POST /api/library
- **Description:** Implement POST /api/library to add item, auto-cache metadata
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** LIB-02
- **Expected Outputs:** Working add to library endpoint
- **Constraints:** Check cache first, fetch from TMDB if not cached, return 409 on duplicate
- **Definition of DONE:** Adds item and returns library item with cached data
- **Commit Message:** `backend: LIB-04 - Implement POST /api/library endpoint`

#### Task LIB-05: Implement PATCH /api/library/:id
- **Description:** Implement PATCH /api/library/:id to update status, rating, notes
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** LIB-02
- **Expected Outputs:** Working update library item endpoint
- **Definition of DONE:** Updates any field, returns updated item
- **Commit Message:** `backend: LIB-05 - Implement PATCH /api/library/:id endpoint`

#### Task LIB-06: Implement DELETE /api/library/:id
- **Description:** Implement DELETE /api/library/:id to remove item
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** LIB-02
- **Expected Outputs:** Working delete library item endpoint
- **Definition of DONE:** Returns 204 on success
- **Commit Message:** `backend: LIB-06 - Implement DELETE /api/library/:id endpoint`

#### Task PREF-01: Create Preferences Service
- **Description:** Implement preferences service for managing user dislikes
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** AUTH-01
- **Expected Outputs:** `server/src/services/preferences.service.ts`
- **Definition of DONE:** Service handles CRUD for preferences
- **Commit Message:** `backend: PREF-01 - Create preferences service`

#### Task PREF-02: Create Preferences Controller
- **Description:** Implement preferences controller
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** PREF-01
- **Expected Outputs:** `server/src/controllers/preferences.controller.ts`
- **Commit Message:** `backend: PREF-02 - Create preferences controller`

#### Task PREF-03: Implement GET /api/preferences
- **Description:** Implement GET /api/preferences endpoint
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** PREF-02
- **Expected Outputs:** Working get preferences endpoint
- **Commit Message:** `backend: PREF-03 - Implement GET /api/preferences endpoint`

#### Task PREF-04: Implement POST /api/preferences
- **Description:** Implement POST /api/preferences to add dislike
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** PREF-02
- **Expected Outputs:** Working add preference endpoint
- **Commit Message:** `backend: PREF-04 - Implement POST /api/preferences endpoint`

#### Task PREF-05: Implement DELETE /api/preferences/:id
- **Description:** Implement DELETE /api/preferences/:id endpoint
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** PREF-02
- **Expected Outputs:** Working delete preference endpoint
- **Commit Message:** `backend: PREF-05 - Implement DELETE /api/preferences/:id endpoint`

#### Task REC-01: Create Recommendation Service
- **Description:** Implement recommendation service with content-based filtering algorithm
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** LIB-01, TMDB-01
- **Expected Outputs:** `server/src/services/recommendation.service.ts`
- **Constraints:** Genre weights: 5★=3pts, 4★=2pts, 3★=1pt, unrated=0.5pts
- **Definition of DONE:** Service generates recommendations based on user history
- **Commit Message:** `backend: REC-01 - Create recommendation service`

#### Task REC-02: Create Recommendation Controller
- **Description:** Implement recommendation controller
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** REC-01
- **Expected Outputs:** `server/src/controllers/recommendations.controller.ts`
- **Commit Message:** `backend: REC-02 - Create recommendation controller`

#### Task REC-03: Implement GET /api/recommendations
- **Description:** Implement GET /api/recommendations?limit= with genre-based recommendations
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** REC-02
- **Expected Outputs:** Working recommendations endpoint
- **Definition of DONE:** Returns personalized recommendations or trending if library empty
- **Commit Message:** `backend: REC-03 - Implement GET /api/recommendations endpoint`

#### Task REC-04: Implement "Similar To" Recommendations
- **Description:** Implement GET /api/recommendations?based_on=:id&type= for similar content
- **Owner:** Backend Builder Agent
- **Worktree:** backend
- **Dependencies:** REC-02
- **Expected Outputs:** Working similar-to endpoint
- **Commit Message:** `backend: REC-04 - Implement similar-to recommendations`

---

### Phase 4: Frontend Setup

#### Task FE-01: Create React Project with Vite
- **Description:** Initialize React project with Vite and TypeScript template
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** None
- **Expected Outputs:** `src/`, `index.html`, `vite.config.ts`
- **Constraints:** Use react-ts template
- **Definition of DONE:** Project builds and dev server runs
- **Commit Message:** `frontend: FE-01 - Create React project with Vite`

#### Task FE-02: Install Frontend Dependencies
- **Description:** Install axios, react-router-dom, @tanstack/react-query, zod
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-01
- **Expected Outputs:** `node_modules/`, `package-lock.json`
- **Commit Message:** `frontend: FE-02 - Install frontend dependencies`

#### Task FE-03: Configure TypeScript and Project Structure
- **Description:** Configure tsconfig.json paths and create directory structure
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-01
- **Expected Outputs:** `tsconfig.json`, all directories created
- **Commit Message:** `frontend: FE-03 - Configure TypeScript and project structure`

#### Task FE-04: Create TypeScript Types
- **Description:** Create src/types/index.ts with all interfaces from design.md
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-02
- **Expected Outputs:** `src/types/index.ts`
- **Constraints:** Must match design.md exactly
- **Definition of DONE:** All types defined and no TypeScript errors
- **Commit Message:** `frontend: FE-04 - Create TypeScript types`

#### Task FE-05: Create API Client
- **Description:** Create src/services/api.ts with Axios instance and JWT interceptors
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-04
- **Expected Outputs:** `src/services/api.ts`
- **Constraints:** Include request/response interceptors for JWT, error handling
- **Definition of DONE:** API client works with auth
- **Commit Message:** `frontend: FE-05 - Create API client with Axios and JWT interceptors`

#### Task FE-06: Configure TanStack Query
- **Description:** Configure QueryClientProvider in App.tsx with default options
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-02, FE-05
- **Expected Outputs:** Modified `src/App.tsx`
- **Constraints:** staleTime: 5min, gcTime: 30min, retry: 1
- **Definition of DONE:** TanStack Query configured and working
- **Commit Message:** `frontend: FE-06 - Configure TanStack Query`

#### Task FE-07: Create AuthContext
- **Description:** Create src/context/AuthContext.tsx for user state management
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-06
- **Expected Outputs:** `src/context/AuthContext.tsx`
- **Constraints:** Store token in localStorage, provide auth state
- **Definition of DONE:** AuthContext provides user data and login/logout methods
- **Commit Message:** `frontend: FE-07 - Create AuthContext`

#### Task FE-08: Create Common Components
- **Description:** Create Button, Input, Card, LoadingSpinner components
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-01
- **Expected Outputs:** `src/components/common/`
- **Constraints:** Reusable, styled consistently
- **Definition of DONE:** All common components created and usable
- **Commit Message:** `frontend: FE-08 - Create common components`

#### Task FE-09: Create Layout Components
- **Description:** Create Header and Footer components
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-08
- **Expected Outputs:** `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`
- **Commit Message:** `frontend: FE-09 - Create layout components`

#### Task FE-10: Create Login Page
- **Description:** Create LoginPage.tsx with form, validation, auth integration
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-07, FE-08
- **Expected Outputs:** `src/pages/LoginPage.tsx`
- **Constraints:** Use Zod for validation, show errors, redirect on success
- **Definition of DONE:** Login works, navigates to home on success
- **Commit Message:** `frontend: FE-10 - Create Login page`

#### Task FE-11: Create Register Page
- **Description:** Create RegisterPage.tsx with form, validation, auth integration
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-07, FE-08
- **Expected Outputs:** `src/pages/RegisterPage.tsx`
- **Constraints:** Use Zod for validation, show errors, redirect on success
- **Definition of DONE:** Register works, navigates to home on success
- **Commit Message:** `frontend: FE-11 - Create Register page`

**⚠️ API CONTRACT FREEZE VERIFIED: After FE-11 DONE, can proceed to FE-12 (API contracts frozen at AUTH-07)**

---

### Phase 5: Frontend Features

#### Task FE-12: Create Home Page
- **Description:** Create HomePage.tsx with recommendations and trending display
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** REC-03 (backend), FE-06
- **Expected Outputs:** `src/pages/HomePage.tsx`
- **Constraints:** Fetch recommendations on mount, handle loading/error
- **Definition of DONE:** Displays recommendations from API
- **Commit Message:** `frontend: FE-12 - Create Home page with recommendations`

#### Task FE-13: Create Search Page
- **Description:** Create SearchPage.tsx with filters (movie/tv), pagination
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** CONTENT-03 (backend), FE-06
- **Expected Outputs:** `src/pages/SearchPage.tsx`
- **Constraints:** Type filter, pagination, search input
- **Definition of DONE:** Search works with filters and pagination
- **Commit Message:** `frontend: FE-13 - Create Search page with filters`

#### Task FE-14: Create ContentCard Component
- **Description:** Create ContentCard component for displaying movie/show info
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-08
- **Expected Outputs:** `src/components/search/ContentCard.tsx`
- **Commit Message:** `frontend: FE-14 - Create ContentCard component`

#### Task FE-15: Create Details Page
- **Description:** Create DetailsPage.tsx showing full content info and actions
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** CONTENT-04 (backend), FE-06
- **Expected Outputs:** `src/pages/DetailsPage.tsx`
- **Constraints:** Show similar content, add to library buttons
- **Definition of DONE:** Details page shows all info, actions work
- **Commit Message:** `frontend: FE-15 - Create Details page`

#### Task FE-16: Create Library Page
- **Description:** Create LibraryPage.tsx with filters, sort, search by title
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** LIB-03 (backend), FE-06
- **Expected Outputs:** `src/pages/LibraryPage.tsx`
- **Constraints:** All filters work: status, genre, type; all sorts work
- **Definition of DONE:** Library page fully functional
- **Commit Message:** `frontend: FE-16 - Create Library page with filters/sort`

#### Task FE-17: Create LibraryItem Component
- **Description:** Create LibraryItem component for library grid
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-08
- **Expected Outputs:** `src/components/library/LibraryItem.tsx`
- **Commit Message:** `frontend: FE-17 - Create LibraryItem component`

#### Task FE-18: Create Preferences Page
- **Description:** Create PreferencesPage.tsx to manage dislikes
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** PREF-03 (backend), FE-06
- **Expected Outputs:** `src/pages/PreferencesPage.tsx`
- **Constraints:** List, add, remove dislikes
- **Definition of DONE:** Preferences page works
- **Commit Message:** `frontend: FE-18 - Create Preferences page`

#### Task FE-19: Create SearchBar Component
- **Description:** Create SearchBar with debounce (300ms)
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-13
- **Expected Outputs:** `src/components/search/SearchBar.tsx`
- **Commit Message:** `frontend: FE-19 - Create SearchBar with debounce`

#### Task FE-20: Add Toast Notifications
- **Description:** Create Toast component and integrate for error handling
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-08
- **Expected Outputs:** Toast component, integrated in API client
- **Commit Message:** `frontend: FE-20 - Add toast notifications for errors`

#### Task FE-21: Implement Infinite Scroll/Pagination
- **Description:** Add infinite scroll or pagination to search and library pages
- **Owner:** Frontend Builder Agent
- **Worktree:** frontend
- **Dependencies:** FE-13, FE-16
- **Expected Outputs:** Pagination in search and library
- **Commit Message:** `frontend: FE-21 - Implement infinite scroll or pagination`

---

### Phase 6: Integration & Polish

#### Task INT-01: Connect Frontend to Backend
- **Description:** Verify all API calls work between frontend and backend
- **Owner:** Integration Agent
- **Worktree:** Both (or test worktree)
- **Dependencies:** All backend and frontend tasks complete
- **Expected Outputs:** All API calls working
- **Commit Message:** `integration: INT-01 - Connect frontend to backend`

#### Task INT-02: Test User Registration Flow
- **Description:** Test complete registration flow: form → API → redirect
- **Owner:** Integration Agent
- **Worktree:** Both
- **Dependencies:** INT-01
- **Expected Outputs:** Registration test passes
- **Commit Message:** `integration: INT-02 - Test user registration flow`

#### Task INT-03: Test User Login Flow
- **Description:** Test complete login flow: form → API → token storage → redirect
- **Owner:** Integration Agent
- **Worktree:** Both
- **Dependencies:** INT-01
- **Expected Outputs:** Login test passes
- **Commit Message:** `integration: INT-03 - Test user login flow`

#### Task INT-04: Test Search and Add to Library Flow
- **Description:** Test: search → view details → add to library
- **Owner:** Integration Agent
- **Worktree:** Both
- **Dependencies:** INT-01
- **Expected Outputs:** Flow test passes
- **Commit Message:** `integration: INT-04 - Test search and add to library flow`

#### Task INT-05: Test Library Filtering and Sorting
- **Description:** Test all filter and sort combinations in library
- **Owner:** Integration Agent
- **Worktree:** Both
- **Dependencies:** INT-01
- **Expected Outputs:** All filter/sort combinations work
- **Commit Message:** `integration: INT-05 - Test library filtering and sorting`

#### Task INT-06: Test Recommendations
- **Description:** Test recommendation display and "similar to" feature
- **Owner:** Integration Agent
- **Worktree:** Both
- **Dependencies:** INT-01
- **Expected Outputs:** Recommendations work
- **Commit Message:** `integration: INT-06 - Test recommendations`

#### Task POL-01: Add Loading States
- **Description:** Add loading spinners/skeletons to all pages
- **Owner:** Integration Agent
- **Worktree:** frontend
- **Dependencies:** INT-01
- **Expected Outputs:** All pages show loading state
- **Commit Message:** `integration: POL-01 - Add loading states`

#### Task POL-02: Add Error Handling UI
- **Description:** Add error states and retry options to all pages
- **Owner:** Integration Agent
- **Worktree:** frontend
- **Dependencies:** INT-01
- **Expected Outputs:** Error UI on all pages
- **Commit Message:** `integration: POL-02 - Add error handling UI`

#### Task POL-03: Responsive Design Check
- **Description:** Verify all pages work on mobile/tablet
- **Owner:** Integration Agent
- **Worktree:** frontend
- **Dependencies:** INT-01
- **Expected Outputs:** Responsive design verified
- **Commit Message:** `integration: POL-03 - Responsive design check`

#### Task POL-04: Performance Optimization
- **Description:** Verify query performance, optimize if needed
- **Owner:** Integration Agent
- **Worktree:** backend
- **Dependencies:** INT-05
- **Expected Outputs:** Performance acceptable (< 200ms for library queries)
- **Commit Message:** `integration: POL-04 - Performance optimization`

---

## 4. EXECUTION FLOW (UPDATED)

### Task Picking Rules

1. **Orchestrator Agent** maintains task queue in `.kilo/tasks.json`
2. **Agents** pick tasks in order from their assigned worktree
3. **Dependencies must be DONE** (not just in progress) before starting a task
4. **Ready tasks** are those with all dependencies DONE AND state=TODO
5. **Agent marks IN_PROGRESS** locally when starting work
6. **Agent commits** when task complete
7. **Orchestrator verifies commit**, then marks DONE

### State Machine Enforcement

```
Agent picks task → marks IN_PROGRESS locally → works → commits
                                   ↓
                         Orchestrator checks:
                         - commit exists?
                         - dependencies DONE?
                         → If yes: marks DONE in .kilo/tasks.json
                         → If no: keeps TODO, agent must fix
```

### Dependency Resolution

```
Task Dependencies Example:
- FE-12 depends on REC-03 (backend)
- REC-03 depends on REC-02, REC-02 depends on REC-01
- REC-01 depends on LIB-01, TMDB-01
- LIB-01 depends on INF-04, CONTENT-01
```

**Resolution:** Agent can only start FE-12 when:
- REC-03 is complete (backend committed)
- FE-06 is complete (frontend committed)

### Commit-Based Progress

1. **Agent completes task** → Commits with proper message format
2. **Commit triggers** → Orchestrator updates task status in `.kilo/tasks.json`
3. **Next task unlocks** → When dependency commits exist in worktree

### Commit Message Format Enforcement

```bash
# Backend tasks
git commit -m "backend: AUTH-01 - Create auth middleware (JWT verification)"

# Frontend tasks  
git commit -m "frontend: FE-04 - Create TypeScript types"

# Integration tasks
git commit -m "integration: INT-02 - Test user registration flow"
```

### Conflict Avoidance

1. **Worktree isolation** - Each agent works in separate worktree, no file conflicts
2. **Backend tasks** only modify `server/` directory
3. **Frontend tasks** only modify `src/` directory
4. **Integration tasks** can modify both but coordinated by orchestrator

### Agent Sync Protocol

1. **Start of day** - Orchestrator checks all worktrees for completed commits
2. **Task completion** - Agent commits and notifies orchestrator
3. **Dependency check** - Orchestrator scans for newly unlocked tasks
4. **Assignment** - Orchestrator assigns next ready task to available agent

### Worktree Merge Strategy

When all tasks in a worktree are complete:

```bash
# From main worktree
git fetch ShowFreak-backend
git merge ShowFreak-backend/backend --no-ff -m "merge: Integrate backend worktree"

git fetch ShowFreak-frontend  
git merge ShowFreak-frontend/frontend --no-ff -m "merge: Integrate frontend worktree"
```

---

## TASK STATUS TRACKING (UPDATED)

Use `.kilo/tasks.json` to track:

```json
{
  "apiFrozen": false,
  "apiFreezeDate": null,
  "tasks": {
    "INF-01": { 
      "status": "DONE", 
      "completedBy": "backend", 
      "commit": "abc123",
      "completedAt": "2026-04-14T10:00:00Z"
    },
    "AUTH-07": { 
      "status": "DONE", 
      "completedBy": "backend", 
      "commit": "def456",
      "completedAt": "2026-04-14T12:00:00Z"
    },
    "AUTH-01": { 
      "status": "IN_PROGRESS", 
      "assignedTo": "backend",
      "startedAt": "2026-04-14T14:00:00Z"
    },
    "FE-01": { 
      "status": "TODO", 
      "assignedTo": "frontend" 
    }
  },
  "worktrees": {
    "backend": "active",
    "frontend": "active"
  },
  "systemStatus": {
    "totalTasks": 52,
    "completed": 2,
    "inProgress": 1,
    "todo": 49
  }
}
```

---

## SYSTEM COMPLETION CHECKLIST

When all items are TRUE, system is DONE:

- [ ] All 52 tasks status = DONE in .kilo/tasks.json
- [ ] apiFrozen = true in .kilo/tasks.json
- [ ] Backend worktree merged to main
- [ ] Frontend worktree merged to main
- [ ] All INT tasks passed (verified by Integration Agent)
- [ ] All POL tasks passed (verified by Integration Agent)
- [ ] Health check: All endpoints return 200

---

## SUMMARY

| Agent | Worktree | Tasks | Phase | File Scope |
|-------|----------|-------|-------|-------------|
| Backend Builder | backend | INF-01 to REC-04 | 1-3 | server/ only |
| Frontend Builder | frontend | FE-01 to FE-21 | 4-5 | src/ only |
| Integration Agent | both | INT-01 to POL-04 | 6 | Read-only + frontend UI fixes |

**Total Atomic Tasks:** 52
**Hardened Features:**
- Strict state machine enforcement (TODO→IN_PROGRESS→DONE)
- File ownership per task (Allowed/Forbidden files)
- API contract freeze mechanism (frozen at AUTH-07)
- Integration agent restrictions (no backend business logic)
- System completion definition (7 criteria)
- Commit-based progress with verification

**Parallel Execution:** Backend and Frontend can run simultaneously with worktree isolation