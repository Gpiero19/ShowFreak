# ShowFreak - Technical Design Document

## 1. Overview

ShowFreak is a full-stack web application that allows users to:
- **Discover** movies and TV shows through search
- **Track** watched content, favorites, and wishlist
- **Receive** personalized recommendations based on their history

### System Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI[React Components]
        TanQ[TanStack Query]
        Axios[Axios Client]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        API[API Routes]
        MW[Middleware]
        SVC[Services]
    end

    subgraph DataLayer["Data Layer"]
        P[Prisma ORM]
        DB[(PostgreSQL)]
    end

    subgraph External["External Services"]
        TMDB[TMDB API]
    end

    UI --> TanQ --> Axios --> API
    API --> MW --> SVC --> P
    P --> DB
    SVC --> TMDB
```

### General Data Flow

1. **User** interacts with Frontend
2. **Frontend** makes requests via TanStack Query (automatic caching)
3. **Backend** validates authentication and processes request
4. **Services** query PostgreSQL or TMDB as needed
5. **Content** from TMDB is cached in PostgreSQL for future operations

---

## 2. Components and Logic

### 2.1 Frontend (React + Vite + TypeScript)

#### Directory Structure

```
src/
├── components/          # Reusable components
│   ├── common/          # Button, Input, Card, Modal, LoadingSpinner
│   ├── layout/          # Header, Footer, Sidebar
│   ├── library/         # LibraryGrid, LibraryItem, FilterBar
│   ├── search/          # SearchBar, SearchResults, ContentCard
│   └── details/         # ContentDetails, CastList, RatingStars
├── pages/               # Main pages
│   ├── HomePage.tsx
│   ├── SearchPage.tsx
│   ├── DetailsPage.tsx
│   ├── LibraryPage.tsx
│   ├── PreferencesPage.tsx
│   └── AuthPage.tsx
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useLibrary.ts
│   ├── useSearch.ts
│   └── useRecommendations.ts
├── services/            # API client
│   ├── api.ts           # Axios base instance
│   ├── authService.ts
│   ├── contentService.ts
│   ├── libraryService.ts
│   └── recommendationService.ts
├── context/             # Global state
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── types/               # TypeScript types
│   └── index.ts
├── utils/               # Utilities
│   ├── formatters.ts
│   └── validators.ts
└── App.tsx
```

#### Frontend Business Rules

| Rule | Description |
|-------|-------------|
| Authentication | JWT stored in localStorage, auto refresh |
| Caching | TanStack Query with 5 minute staleTime |
| Pagination | Infinite scroll or pagination with limit=20 |
| Validation | Zod for form validation |
| Errors | Toast notifications for errors, auto retry |

### 2.2 Backend (Node.js + Express + TypeScript)

#### Directory Structure

```
server/
├── src/
│   ├── routes/                 # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── content.routes.ts
│   │   ├── library.routes.ts
│   │   ├── preferences.routes.ts
│   │   └── recommendations.routes.ts
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── content.controller.ts
│   │   ├── library.controller.ts
│   │   ├── preferences.controller.ts
│   │   └── recommendations.controller.ts
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── tmdb.service.ts
│   │   ├── cache.service.ts
│   │   ├── library.service.ts
│   │   ├── recommendation.service.ts
│   │   └── preferences.service.ts
│   ├── models/                # Prisma models
│   │   └── index.ts
│   ├── middleware/            # Middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── config/                # Configuration
│   │   └── index.ts
│   ├── utils/                 # Utilities
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/                 # Types
│   │   └── index.ts
│   ├── app.ts                 # Express app
│   └── server.ts              # Entry point
└── prisma/
    └── schema.prisma
```

#### Backend Business Rules

| Rule | Description |
|-------|-------------|
| Authentication | JWT with expiresIn: 7d, payload: { userId, email } |
| Authorization | Users can only access their own data |
| Rate Limiting | 100 req/min for user endpoints |
| TMDB Rate Limit | Max 40 requests/second (follow TMDB headers) |
| Validation | Zod for schema validation |
| Errors | Standardized: { success: false, error: string, code: string } |

### 2.3 Database (PostgreSQL + Prisma)

#### Data Services

```typescript
// Prisma Service - database access
class PrismaService {
  private prisma: PrismaClient;
  
  async onModuleInit() {
    this.prisma = new PrismaClient();
    await this.prisma.$connect();
  }
  
  get users() { return this.prisma.users; }
  get contentCache() { return this.prisma.contentCache; }
  get libraryItems() { return this.prisma.libraryItems; }
  get userPreferences() { return this.prisma.userPreferences; }
}
```

#### External Services - TMDB

```typescript
// TMDB Service - external API integration
class TmdbService {
  private baseUrl = 'https://api.themoviedb.org/3';
  private apiKey: string;
  
  async searchContent(query: string, type?: 'movie' | 'tv', page = 1)
  async getContentDetails(id: string, type: 'movie' | 'tv')
  async getSimilar(id: string, type: 'movie' | 'tv')
  async discoverByGenres(genres: string[], type: 'movie' | 'tv')
  async getTrending(type: 'movie' | 'tv' | 'all', timeWindow = 'week')
}
```

### 2.4 Recommendation System

#### Recommendation Algorithm

```typescript
interface RecommendationInput {
  userId: string;
  basedOn?: string; // specific external_id
}

interface RecommendationOutput {
  items: ContentItem[];
  source: 'genre_preference' | 'watch_history' | 'similar_to';
}

// Genre weights
const GENRE_WEIGHTS = {
  5: 3,  // 5 stars = 3 points
  4: 2,  // 4 stars = 2 points
  3: 1,  // 3 stars = 1 point
  null: 0.5,  // No rating = 0.5 points
};
```

#### Recommendation Pipeline

1. Get user's watched items from `library_items`
2. JOIN with `content_cache` to get genres
3. Calculate genre weight using personal ratings
4. Exclude genres from `user_preferences` (dislikes)
5. Query TMDB discover endpoint with preferred genres
6. Filter by content type (movie vs tv)
7. Sort by vote_average
8. Return top 20 results

---

## 3. Contracts and Types

### 3.1 TypeScript Types - Frontend

```typescript
// types/index.ts

// ============================================
// ENUMS
// ============================================

export enum ContentType {
  MOVIE = 'movie',
  TV = 'tv',
}

export enum LibraryStatus {
  WATCHED = 'watched',
  FAVORITE = 'favorite',
  WISHLIST = 'wishlist',
}

export enum SortField {
  CREATED_AT = 'created_at',
  PERSONAL_RATING = 'personal_rating',
  VOTE_AVERAGE = 'vote_average',
  RELEASE_YEAR = 'release_year',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// CONTENT TYPES
// ============================================

export interface ContentCache {
  externalId: string;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  genres: string[];
}

export interface ContentDetails extends ContentCache {
  overview: string;
  tagline: string | null;
  runtime: number | null;
  status: string;
  voteCount: number;
  popularity: number;
  backdropPath: string | null;
  originalLanguage: string;
  genres: string[];
}

export interface ContentSearchResult {
  externalId: string;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  overview: string;
}

// ============================================
// LIBRARY TYPES
// ============================================

export interface LibraryItem {
  id: string;
  userId: string;
  externalId: string;
  contentType: ContentType;
  status: LibraryStatus;
  personalRating: number | null;
  notes: string | null;
  watchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined from content_cache
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  genres: string[];
}

export interface CreateLibraryItemDto {
  externalId: string;
  contentType: ContentType;
  status: LibraryStatus;
}

export interface UpdateLibraryItemDto {
  status?: LibraryStatus;
  personalRating?: number | null;
  notes?: string | null;
  watchedAt?: Date | null;
}

export interface LibraryQueryParams {
  page?: number;
  limit?: number;
  sort?: SortField;
  order?: SortOrder;
  q?: string;
  genre?: string;
  status?: LibraryStatus;
  type?: ContentType;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// PREFERENCES TYPES
// ============================================

export interface UserPreference {
  id: string;
  userId: string;
  externalId: string;
  contentType: ContentType;
  dislikeReason: string | null;
  createdAt: Date;
}

export interface CreatePreferenceDto {
  externalId: string;
  contentType: ContentType;
  dislikeReason?: string;
}

// ============================================
// RECOMMENDATION TYPES
// ============================================

export interface Recommendation {
  externalId: string;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  genres: string[];
  source: 'genre_preference' | 'watch_history' | 'similar_to';
}
```

### 3.2 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS
// ============================================

model User {
  id           String    @id @default(uuid()) @db.Uuid
  email        String    @unique @db.VarChar(255)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  username     String    @db.VarChar(100)
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz

  libraryItems      LibraryItem[]
  userPreferences   UserPreference[]

  @@map("users")
}

// ============================================
// CONTENT CACHE
// ============================================

model ContentCache {
  externalId   String   @id @map("external_id") @db.VarChar(50)
  contentType String   @map("content_type") @db.VarChar(20)
  title        String   @db.VarChar(255)
  posterPath   String?  @map("poster_path") @db.VarChar(255)
  voteAverage  Decimal? @map("vote_average") @db.Decimal(3, 1)
  releaseYear Int?     @map("release_year")
  genres       Json     // Array of strings: ["Action", "Adventure"]
  cachedAt     DateTime @default(now()) @map("cached_at") @db.Timestamptz
  expiresAt    DateTime @map("expires_at") @db.Timestamptz

  libraryItems LibraryItem[]

  @@index([contentType], name: "idx_content_type")
  @@index([title], name: "idx_title")
  @@index([genres], name: "idx_genres", type: Gin)
  @@map("content_cache")
}

// ============================================
// LIBRARY ITEMS
// ============================================

model LibraryItem {
  id             String    @id @default(uuid()) @db.Uuid
  userId         String    @map("user_id") @db.Uuid
  externalId     String    @map("external_id") @db.VarChar(50)
  contentType    String    @map("content_type") @db.VarChar(20)
  status         String    @db.VarChar(20) // watched, favorite, wishlist
  personalRating Int?      @map("personal_rating")
  notes          String?   @db.Text
  watchedAt      DateTime? @map("watched_at") @db.Timestamptz
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  contentCache ContentCache  @relation(fields: [externalId], references: [externalId])

  @@unique([userId, externalId], name: "uq_library_user_content")
  @@index([userId, status], name: "idx_library_user_status")
  @@index([userId, contentType], name: "idx_library_user_type")
  @@map("library_items")
}

// ============================================
// USER PREFERENCES
// ============================================

model UserPreference {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  externalId    String    @map("external_id") @db.VarChar(50)
  contentType   String    @map("content_type") @db.VarChar(20)
  dislikeReason String?   @map("dislike_reason") @db.VarChar(50)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId], name: "idx_preferences_user")
  @@map("user_preferences")
}
```

### 3.3 API Contracts

#### Authentication

```typescript
// POST /api/auth/register
// Input:
{
  email: string;        // required, valid email
  password: string;     // required, min 8 chars
  username: string;    // required, 3-30 chars, alphanumeric
}

// Output (201):
{
  success: true;
  data: {
    user: { id, email, username, createdAt };
    token: string; // JWT
  };
}

// Output (400 - Error):
{
  success: false;
  error: string;
  code: 'EMAIL_EXISTS' | 'USERNAME_TAKEN' | 'VALIDATION_ERROR';
}

// ============================================
// POST /api/auth/login
// Input:
{
  email: string;
  password: string;
}

// Output (200):
{
  success: true;
  data: {
    user: { id, email, username, createdAt };
    token: string;
  };
}

// Output (401 - Error):
{
  success: false;
  error: 'Invalid credentials';
  code: 'INVALID_CREDENTIALS';
}

// ============================================
// GET /api/auth/me
// Headers: Authorization: Bearer <token>

// Output (200):
{
  success: true;
  data: { id, email, username, createdAt };
}
```

#### Content

```typescript
// GET /api/content/search?q=avatar&type=movie&page=1&limit=20
// Query Params:
//   - q: string (required)
//   - type?: 'movie' | 'tv'
//   - page?: number (default: 1)
//   - limit?: number (default: 20, max: 100)

// Output (200):
{
  success: true;
  data: {
    data: Array<{
      externalId: string;
      contentType: 'movie' | 'tv';
      title: string;
      posterPath: string | null;
      voteAverage: number | null;
      releaseYear: number | null;
      overview: string;
    }>;
    pagination: { page, limit, total, totalPages };
  };
}

// ============================================
// GET /api/content/:id?type=movie
// Path Params:
//   - id: string (TMDB external_id)
// Query Params:
//   - type: 'movie' | 'tv' (required)

// Output (200):
{
  success: true;
  data: {
    externalId: string;
    contentType: 'movie' | 'tv';
    title: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    voteAverage: number | null;
    voteCount: number;
    releaseYear: number | null;
    genres: string[];
    runtime: number | null;
    status: string;
    tagline: string | null;
  };
}

// ============================================
// GET /api/content/:id/similar?type=movie&limit=20
// Path Params:
//   - id: string
// Query Params:
//   - type: 'movie' | 'tv' (required)
//   - limit?: number

// Output (200):
{
  success: true;
  data: Array<ContentSearchResult>;
}
```

#### Library

```typescript
// GET /api/library?page=1&limit=20&sort=release_year&order=desc&q=avatar&genre=action&status=watched&type=movie
// Query Params:
//   - page?: number
//   - limit?: number
//   - sort?: 'created_at' | 'personal_rating' | 'vote_average' | 'release_year' | 'title'
//   - order?: 'asc' | 'desc'
//   - q?: string (search by title)
//   - genre?: string
//   - status?: 'watched' | 'favorite' | 'wishlist'
//   - type?: 'movie' | 'tv'

// Output (200):
{
  success: true;
  data: {
    data: Array<LibraryItem>; // includes content_cache data
    pagination: { page, limit, total, totalPages };
  };
}

// ============================================
// POST /api/library
// Headers: Authorization: Bearer <token>
// Input:
{
  externalId: string;    // TMDB id
  contentType: 'movie' | 'tv';
  status: 'watched' | 'favorite' | 'wishlist';
}

// Output (201):
{
  success: true;
  data: LibraryItem; // includes content_cache data
}

// ============================================
// PATCH /api/library/:id
// Headers: Authorization: Bearer <token>
// Input (partial):
{
  status?: 'watched' | 'favorite' | 'wishlist';
  personalRating?: number | null; // 1-5
  notes?: string | null;
  watchedAt?: string | null; // ISO date
}

// Output (200):
{
  success: true;
  data: LibraryItem;
}

// ============================================
// DELETE /api/library/:id
// Headers: Authorization: Bearer <token>

// Output (204): No content
```

#### Preferences

```typescript
// GET /api/preferences
// Headers: Authorization: Bearer <token>

// Output (200):
{
  success: true;
  data: Array<UserPreference>;
}

// ============================================
// POST /api/preferences
// Headers: Authorization: Bearer <token>
// Input:
{
  externalId: string;
  contentType: 'movie' | 'tv';
  dislikeReason?: string;
}

// Output (201):
{
  success: true;
  data: UserPreference;
}

// ============================================
// DELETE /api/preferences/:id
// Headers: Authorization: Bearer <token>

// Output (204): No content
```

#### Recommendations

```typescript
// GET /api/recommendations?limit=20
// Headers: Authorization: Bearer <token>
// Query Params:
//   - limit?: number

// Output (200):
{
  success: true;
  data: {
    items: Array<Recommendation>;
    basedOn: 'genre_preference' | 'watch_history';
  };
}

// ============================================
// GET /api/recommendations?based_on=123&type=movie
// Headers: Authorization: Bearer <token>
// Query Params:
//   - based_on: string (external_id)
//   - type: 'movie' | 'tv'
//   - limit?: number

// Output (200):
{
  success: true;
  data: {
    items: Array<Recommendation>;
    basedOn: 'similar_to';
    sourceTitle: string;
  };
}
```

---

## 4. Sequence Diagrams

### 4.1 User Registration

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Fill registration form
    F->>B: POST /api/auth/register<br/>{ email, password, username }
    
    B->>B: Validate input (Zod)
    alt Validation failed
        B-->>F: 400 Validation Error
        F-->>U: Show error message
    else Validation passed
        B->>DB: Check if email exists
        alt Email exists
            B-->>F: 400 Email already exists
            F-->>U: Show error
        else Email available
            B->>B: Hash password (bcrypt)
            B->>DB: Insert user
            DB-->>B: Return user
            B->>B: Generate JWT token
            B-->>F: 201 { user, token }
            F->>F: Store token in localStorage
            F-->>U: Redirect to Home
        end
    end
```

### 4.2 User Login

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Enter credentials
    F->>B: POST /api/auth/login<br/>{ email, password }
    
    B->>B: Validate input
    B->>DB: Find user by email
    
    alt User not found
        B-->>F: 401 Invalid credentials
        F-->>U: Show error
    else User found
        B->>B: Compare password (bcrypt)
        alt Password invalid
            B-->>F: 401 Invalid credentials
            F-->>U: Show error
        else Password valid
            B->>B: Generate JWT token
            B-->>F: 200 { user, token }
            F->>F: Store token, set auth state
            F-->>U: Redirect to Home
        end
    end
```

### 4.3 Search Content

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant TMDB as TMDB API

    U->>F: Type search query
    F->>F: Debounce 300ms
    F->>B: GET /api/content/search?q=avatar&type=movie&page=1
    
    B->>TMDB: Forward search request<br/>GET /search/movie?query=avatar
    TMDB-->>B: Return search results
    
    B->>DB: Cache results in content_cache<br/>(upsert for each result)
    DB-->>B: Confirm insert/update
    
    B-->>F: Return paginated results
    F-->>U: Display results grid
    
    Note over F,B: TanStack Query caches response<br/>for 5 minutes
```

### 4.4 Add to Library

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant TMDB as TMDB API

    U->>F: Click "Add to Watchlist"
    F->>B: POST /api/library<br/>{ externalId: "123", contentType: "movie", status: "wishlist" }
    
    B->>DB: Check if content_cache exists
    alt Not cached
        B->>TMDB: GET /movie/123
        TMDB-->>B: Return movie details
        B->>DB: Insert content_cache<br/>expires_at = now + 30 days
    end
    
    B->>DB: Check UNIQUE constraint<br/>(userId + externalId)
    alt Already in library
        B-->>F: 409 Conflict
        F-->>U: Show "Already in library"
    else Not in library
        B->>DB: Insert library_item
        DB-->>B: Return library item
        
        alt Status is "watched"
            B->>DB: Update watched_at = NOW()
        end
        
        B-->>F: 201 { libraryItem }
        F->>F: Invalidate library query cache
        F-->>U: Show success, update UI
    end
```

### 4.5 Get Recommendations

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant TMDB as TMDB API

    U->>F: Visit Home page
    F->>B: GET /api/recommendations
    
    B->>DB: Get user's library items<br/>JOIN with content_cache
    
    alt Library empty
        B->>TMDB: Get trending movies
        TMDB-->>B: Return trending
        B-->>F: Return trending as recommendations
    else Library has items
        B->>B: Extract genres weighted by ratings
        B->>B: Exclude disliked genres
        B->>TMDB: GET /discover/movie<br/>?with_genres=action,adventure
        TMDB-->>B: Return results
        B->>B: Filter out already in library
        B-->>F: Return top 20 ranked by vote_average
    end
    
    F-->>U: Display recommendations
```

### 4.6 Library Filtering and Sorting

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Select filter: genre=Action<br/>Sort: vote_average desc
    
    F->>B: GET /api/library<br/>?genre=action&sort=vote_average&order=desc
    
    B->>B: Build parameterized query
    B->>DB: Execute JOIN query<br/>SELECT li.*, cc.* FROM library_items li<br/>JOIN content_cache cc ON ...<br/>WHERE cc.genres @> '["Action"]'<br/>ORDER BY cc.vote_average DESC
    
    DB-->>B: Return filtered results + count
    
    B-->>F: Return paginated response
    F-->>U: Display filtered/sorted grid
    
    Note over F,B: No external API calls<br/>All from PostgreSQL cache
```

---

## 5. Task Board

### 5.1 Database

- [ ] **Setup PostgreSQL**
  - [ ] Create database `showfreak`
  - [ ] Configure connection string in `.env`

- [ ] **Prisma Migrations**
  - [ ] Create `prisma/schema.prisma` with all models
  - [ ] Run `npx prisma migrate dev --name init`
  - [ ] Generate client `npx prisma generate`

- [ ] **Indexes**
  - [ ] Verify index on `content_cache.genres` (GIN)
  - [ ] Verify index on `library_items(user_id, status)`
  - [ ] Verify index on `library_items(user_id, content_type)`
  - [ ] Verify UNIQUE constraint on `library_items(userId, externalId)`

- [ ] **Seed Data (optional)**
  - [ ] Create script to populate content_cache with test data

---

### 5.2 Backend

- [ ] **Initial Setup**
  - [ ] Initialize Node.js project with TypeScript
  - [ ] Install dependencies: express, prisma, jsonwebtoken, bcrypt, zod, cors, dotenv
  - [ ] Create `src/config/index.ts` for environment variables

- [ ] **Base Structure**
  - [ ] Create `src/app.ts` with Express
  - [ ] Create `src/server.ts` as entry point
  - [ ] Configure middlewares: JSON, CORS, error handling

- [ ] **Authentication**
  - [ ] Implement `src/middleware/auth.middleware.ts`
  - [ ] Implement `src/services/auth.service.ts`
  - [ ] Implement `src/controllers/auth.controller.ts`
  - [ ] Implement routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`

- [ ] **External Services**
  - [ ] Implement `src/services/tmdb.service.ts`
  - [ ] Implement TMDB rate limiting handling
  - [ ] Implement automatic response caching

- [ ] **Content**
  - [ ] Implement `src/services/content.service.ts`
  - [ ] Implement `src/controllers/content.controller.ts`
  - [ ] Implement routes: `/api/content/search`, `/api/content/:id`, `/api/content/:id/similar`

- [ ] **Library**
  - [ ] Implement `src/services/library.service.ts`
  - [ ] Implement `src/controllers/library.controller.ts`
  - [ ] Implement routes: GET/POST/PATCH/DELETE `/api/library`
  - [ ] Implement caching logic when adding items
  - [ ] Implement filtering and sorting with JOIN

- [ ] **Preferences**
  - [ ] Implement `src/services/preferences.service.ts`
  - [ ] Implement `src/controllers/preferences.controller.ts`
  - [ ] Implement routes: GET/POST/DELETE `/api/preferences`

- [ ] **Recommendations**
  - [ ] Implement `src/services/recommendation.service.ts`
  - [ ] Implement genre filtering algorithm
  - [ ] Implement TMDB "similar to" integration
  - [ ] Implement route: GET `/api/recommendations`

- [ ] **Validation**
  - [ ] Add Zod schemas for all DTOs
  - [ ] Implement validation middleware

- [ ] **Error Handling**
  - [ ] Create custom error class
  - [ ] Implement error middleware
  - [ ] Standardize error responses

- [ ] **Rate Limiting**
  - [ ] Implement rate limiting middleware
  - [ ] Configure limits per endpoint

---

### 5.3 Frontend

- [ ] **Initial Setup**
  - [ ] Create project with Vite: `npm create vite@latest -- --template react-ts`
  - [ ] Install dependencies: axios, react-router-dom, @tanstack/react-query, zod
  - [ ] Configure TypeScript paths

- [ ] **Types**
  - [ ] Create `src/types/index.ts` with all interfaces

- [ ] **API Client**
  - [ ] Create `src/services/api.ts` with Axios instance
  - [ ] Implement JWT interceptors
  - [ ] Implement global error handling

- [ ] **Authentication**
  - [ ] Create `src/context/AuthContext.tsx`
  - [ ] Create pages: LoginPage, RegisterPage
  - [ ] Create hook `useAuth.ts`

- [ ] **Common Components**
  - [ ] Create Button, Input, Card, LoadingSpinner
  - [ ] Create Header, Footer, Layout
  - [ ] Create Toast/Notification component

- [ ] **Home Page**
  - [ ] Create `HomePage.tsx`
  - [ ] Fetch and display recommendations
  - [ ] Fetch and display trending

- [ ] **Search**
  - [ ] Create `SearchPage.tsx`
  - [ ] Implement SearchBar with debounce
  - [ ] Implement type filters (movie/tv)
  - [ ] Create ContentCard component
  - [ ] Create hook `useSearch.ts`

- [ ] **Content Details**
  - [ ] Create `DetailsPage.tsx`
  - [ ] Display full information
  - [ ] Action buttons (add to library)
  - [ ] Show similar content

- [ ] **Library**
  - [ ] Create `LibraryPage.tsx`
  - [ ] Implement filters: status, genre, type
  - [ ] Implement sorting
  - [ ] Implement title search
  - [ ] Create components: LibraryGrid, LibraryItem, FilterBar
  - [ ] Create hook `useLibrary.ts`

- [ ] **Preferences**
  - [ ] Create `PreferencesPage.tsx`
  - [ ] List dislikes
  - [ ] Add/remove dislikes
  - [ ] Create hook `usePreferences.ts`

- [ ] **TanStack Query**
  - [ ] Configure QueryClientProvider
  - [ ] Configure stale times per query type
  - [ ] Implement mutation invalidation

---

### 5.4 Integration

- [ ] **Integration Tests**
  - [ ] Test full flow: register → login → search → add to library
  - [ ] Test filtering and sorting
  - [ ] Test recommendations

- [ ] **Error Handling**
  - [ ] Test API error handling
  - [ ] Test auto retry
  - [ ] Test offline handling

- [ ] **Performance**
  - [ ] Verify library query response time
  - [ ] Verify cache effectiveness
  - [ ] Optimize queries if needed

---

## 6. Additional Notes

### 6.1 MVP Considerations

| Aspect | Recommendation |
|--------|---------------|
| **TMDB API Key** | Get free API key (1000 requests/day) |
| **Images** | Use TMDB image base URL: `https://image.tmdb.org/t/p/` |
| **Authentication** | Keep simple: email + password |
| **Validation** | Zod for server-side validation |
| **Testing** | Focus on integration tests of main flows |

### 6.2 Scalability Strategies

#### Cache Strategy

```typescript
// Server-side cache TTL
const CACHE_TTL = {
  SEARCH: 15 * 60 * 1000,        // 15 minutes
  CONTENT_DETAILS: 24 * 60 * 60 * 1000,  // 24 hours
  TRENDING: 60 * 60 * 1000,      // 1 hour
  RECOMMENDATIONS: 60 * 60 * 1000, // 1 hour
};
```

#### Indexing Strategy

```sql
-- Critical performance indexes
CREATE INDEX idx_content_genres ON content_cache USING gin(genres);
CREATE INDEX idx_library_user_status ON library_items(user_id, status);
CREATE INDEX idx_library_user_type ON library_items(user_id, content_type);
CREATE INDEX idx_library_user_created ON library_items(user_id, created_at DESC);
```

#### Prefetching

- When showing details page, prefetch "similar" in background
- When loading library, prefetch next page
- Use TanStack Query `prefetchQuery` to anticipate user actions

### 6.3 TanStack Query - Recommended Configuration

```typescript
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Toast error notification
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 6.4 State Management

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND STATE                        │
├─────────────────────┬───────────────────────────────────┤
│ State               │ Solution                          │
├─────────────────────┼───────────────────────────────────┤
│ User session        │ AuthContext + localStorage        │
│ Server state        │ TanStack Query                    │
│ UI state            │ useState / useReducer            │
│ Form state          │ react-hook-form + Zod           │
│ URL state           │ React Router                      │
└─────────────────────┴───────────────────────────────────┘
```

### 6.5 Required Environment Variables

```bash
# .env

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/showfreak"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# TMDB
TMDB_API_KEY="your-tmdb-api-key"
TMDB_BASE_URL="https://api.themoviedb.org/3"
TMDB_IMAGE_BASE="https://image.tmdb.org/t/p"

# Server
PORT=3001
NODE_ENV=development
```

---

*Document Generated: March 2026*
*Version: 1.0*
*Project: ShowFreak*
