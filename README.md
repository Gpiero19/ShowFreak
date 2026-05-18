# ShowFreak

**Full-stack web application for discovering, tracking, and getting personalized recommendations for movies and TV shows.**

ShowFreak helps users build their personal media library, track what they've watched, and receive smart recommendations based on their viewing history and preferences.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.9-2D3748?logo=prisma)](https://prisma.io/)

## 🚀 Tech Stack

### Frontend
- **React 18** with Hooks and Context API
- **TypeScript** with strict type safety
- **Vite** for fast development and optimized builds
- **React Router v6** for SPA navigation
- **TanStack Query** for server state management
- **Zod** for runtime validation

### Backend
- **Node.js 20+** with ES2022 modules
- **Express.js** RESTful API
- **TypeScript** with comprehensive type definitions
- **JWT** authentication with bcrypt password hashing
- **Zod** for request validation

### Database & Infrastructure
- **PostgreSQL** with optimized indexing
- **Prisma ORM** for type-safe database queries
- **TMDB API** integration with intelligent caching

## ✨ Key Features

- 🔍 **Smart Search** - Search movies and TV shows via TMDB API
- 📚 **Personal Library** - Track watched, favorite, and wishlist items
- ⭐ **Rating System** - Rate content 1-5 stars and add personal notes
- 🎯 **Content-Based Recommendations** - Personalized suggestions based on viewing history
- 🚫 **Dislike Filtering** - Exclude genres you don't enjoy
- 🏷️ **Genre Filtering** - Filter library by genres with PostgreSQL JSONB queries
- 📊 **Flexible Sorting** - Sort by rating, release year, or date added

## 📁 Project Structure

```
showfreak/
├── src/                    # Frontend (React + Vite)
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route pages (Home, Library, Search, Details, Preferences)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client functions
│   ├── context/          # React Context providers
│   └── types/            # TypeScript interfaces
├── server/                 # Backend (Node.js + Express)
│   ├── routes/           # API endpoint definitions
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation, error handling
│   └── prisma/           # Database schema and migrations
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- TMDB API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/showfreak.git
cd showfreak

# Install dependencies
npm install

# Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your database URL and TMDB API key

# Run database migrations
cd server
npm run db:push

# Start development servers
npm run dev
```

### Available Scripts

```bash
npm run dev           # Start both frontend and backend
npm run dev:frontend  # Start frontend only (localhost:5173)
npm run dev:backend   # Start backend only (localhost:3001)
npm run build         # Build both frontend and backend
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript compiler check
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Content
- `GET /api/content/search` - Search TMDB for movies/TV shows
- `GET /api/content/:id` - Get content details
- `GET /api/content/:id/similar` - Get similar content

### Library
- `GET /api/library` - Get user's library (with filtering/sorting)
- `POST /api/library` - Add item to library
- `PATCH /api/library/:id` - Update library item
- `DELETE /api/library/:id` - Remove from library

### Recommendations
- `GET /api/recommendations` - Get personalized recommendations

## 🎯 Architecture Highlights

- **Modular Design** - Clean separation of concerns (Controllers → Services → Database)
- **Type Safety** - End-to-end TypeScript with no `any` types
- **Optimized Queries** - All library operations use JOINs with cached data (no N+1 queries)
- **JWT Auth** - Secure authentication with bcrypt password hashing
- **Content Caching** - TMDB data cached locally to minimize external API calls

## 📊 Database Schema

The application uses a well-normalized PostgreSQL schema with:
- `users` - User accounts with secure password storage
- `content_cache` - Cached TMDB metadata with genre indexing
- `library_items` - User's personal library with status tracking
- `user_preferences` - Disliked content for recommendation filtering

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**ShowFreak** - Your personal guide to the world of movies and TV shows.