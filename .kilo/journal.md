# Kilo Development Journal

## 2026-05-11 Session

### Work Completed

#### Main Pages Implementation (FE-12, FE-13, FE-15, FE-16, FE-18)
- **Home Page**: Enhanced to use ContentCard component and display personalized recommendations from `useRecommendations` hook.
- **Search Page**: Implemented full search functionality with URL query parameters, API integration, and results display using ContentCard grid.
- **Details Page**: Enhanced from stub to full content details with poster, overview, genres, release year, and rating.
- **Library Page**: Implemented with complete filtering (status, type, search), sorting, and display of user's library items using `useLibrary` hook.
- **Preferences Page**: Implemented with form to add dislikes (by TMDB ID) and list of current dislikes with remove functionality using `usePreferences` hook.

#### Navbar Component (FE-09)
- Created full-width authenticated-only navigation bar using CSS Modules
- Displays links to Home, Search, Library, Preferences
- Shows username and logout button when authenticated

#### Hooks Created
- `useLibrary` – Fetch library items with query parameters
- `usePreferences` – Fetch user dislikes
- `useLibraryMutations` – Mutations for add/update/remove library items
- `usePreferenceMutations` – Mutations for add/remove dislikes
- `useLibraryItem` – Fetch single library item by externalId

#### Backend Fixes & TMDB Integration (CONTENT-02, LIB-02)
- Implemented full TMDB service with search, details, similar endpoints
- Fixed library controller:
  - Corrected Prisma queries (count, findMany with proper orderBy)
  - Fixed type handling for `contentType`, `voteAverage` (Decimal → number), `genres` (Json → string[])
  - Removed unsupported `include` from count query
  - Added composite key handling for content_cache upsert using `externalId_contentType`
- Fixed frontend API URL: removed duplicate `/api` prefix (axios baseURL already includes it)

#### Details Page Enhancements (FE-15)
- Added star rating system (1-5 stars) with hover effect
- Added notes textarea for personal annotations
- Added conditional UI: if item in library → show edit form (status, rating, notes, update/remove buttons); else → show add to library form with status selector
- Added dislike toggle section
- Integrated `useLibraryItem` to fetch existing library entry and `useLibraryMutations`/`usePreferenceMutations` for mutations
- Added comprehensive CSS styling for all new UI components

### Git Commits
- f7c5d41: feat: implement main pages and navbar
- bf80909: fix: correct library API endpoint URL and improve hook configuration
- b3fb6b7: feat: implement TMDB integration for content search and details
- e3da63c: feat: enhance details page with library management and dislike functionality

### Important Discoveries
- **Prisma composite keys**: When table uses `@@id([externalId, contentType])`, upsert `where` must use `{ externalId_contentType: { externalId, contentType } }`.
- **Prisma orderBy**: For nested relations use `orderBy: { content_cache: { field: direction } }`; for direct fields use `orderBy: { field: direction }`.
- **Decimal handling**: Prisma returns `Decimal` objects; convert to `Number` for frontend compatibility.
- **JSONB handling**: Prisma returns `JsonValue` for JSONB; cast to `string[]` after validation.
- **Axios baseURL**: The axios instance sets `baseURL: '/api'`; frontend calls should use paths like `/library` not `/api/library`.
- **React Query cache**: After mutations, invalidate relevant query keys (`library`, `recommendations`, `preferences`) to refetch.
- **useEffect vs useState**: Use `useEffect` to sync state from query data; `useState` initializer runs only once.

### Next Steps
All core functionality per specs.md is now implemented. Next steps:
- Add toast/notification system for user feedback
- Implement pagination or infinite scroll
- Write unit/integration tests (Jest)
- Polish UI with design system and accessibility improvements
- Performance optimization (memoization, lazy loading)
- Consider deployment setup

## 2026-05-11 Continued

### Library Page UI Enhancement (FE-16)
- Replaced status and type dropdown selects with toggle button groups
- Toggle buttons are colorless when inactive, colored when active:
  - Status: Watched (orange), Favorite (green), Wishlist (blue)
  - Type: Movies (purple), TV Shows (red)
- Multiple selections per category supported (OR logic)
- More visual and intuitive filter interface
- Commit: 785c7d4

### Library Page UI Refinement (FE-16)
- Changed status filter buttons to single-select (radio) behavior
- Only one status (Watched, Favorite, Wishlist) can be active at a time
- Type filters remain multi-select for flexible browsing
- Matches original dropdown single-select semantics while keeping toggle UI
- Commit: ecb7b6f

### Library Page UI Finalization (FE-16)
- Changed type filter to single-select (radio) to match status filter
- Only Movies OR TV Shows can be selected, not both simultaneously
- All filter buttons now have exclusive selection within their category
- Consistent UI: one active status + one active type maximum
- Commit: 77dab3f

### Recommendation System Implementation (REC-03, REC-04)
- Implemented full recommendation algorithm in `recommendationService`:
  * **Genre-based**: Weights user's watched genres by personal rating (5★=3pts, 4★=2pts, 3★=1pt, unrated=0.5pt), takes top 3, queries TMDB discover
  * **Similar-to**: Fetches similar content from TMDB for a given item ID
  * **Trending fallback**: Returns TMDB trending when user has no library
- Excludes disliked content and items already in library
- Prefers content type (movie/tv) based on user's watch history
- Sorts by vote_average (min 6) for quality
- Controller now returns real data instead of stubs
- Updated Recommendation type to include `trending` source
- Made TMDBService.client public for service access
- Commit: f0f0c1d

### GitHub Commits (summary)
- f0f0c1d: REC-03, REC-04: implement full recommendation algorithm
- 8616666: docs: update journal and context with single-select type filter change
- 77dab3f: feat: make type filters (Movies/TV) single-select as well
- 785c7d4: feat: replace library filter dropdowns with toggle buttons
- e3da63c: feat: enhance details page with library management and dislike functionality
- b3fb6b7: feat: implement TMDB integration for content search and details
- bf80909: fix: correct library API endpoint URL and improve hook configuration
- f7c5d41: feat: implement main pages and navbar

### Bug Fix: Recommendations Not Showing (REC-03 follow-up)
**Problem**: Home page displayed empty recommendations even though user had library items.
**Root Cause**: Content details endpoint cached genre **names** instead of genre **IDs**. Recommendation algorithm uses genre IDs to query TMDB discover; passing names resulted in no matches.
**Fix**:
- Modified `content.controller.getDetails` to store `genreIds` (from `g.id`) in `content_cache.genres` while returning `genreNames` (from `g.name`) to frontend
- Added fallback: if genre-based filtering yields zero results, automatically fall back to trending recommendations
- Ensures home page always displays content (personalized or trending)
- Commit: 777ded8

### Additional Notes
- New library items added after this fix will have proper genre IDs
- Existing items with name-based genres may still yield empty personal recs until re-added
- Trending fallback guarantees some recommendations even with empty/mismatched library

### Home Page Filter Enhancement (FE-12)
- Added Movie/TV toggle filter to recommendations section
- Three-state button group: All (gray), Movies (purple), TV Shows (red)
- Single-select behavior: only one content type filter at a time
- Filtering applied client-side to recommendation results
- Maintains consistency with library page filter UI
- Commit: b8b3f8c

### Home Page Filter Simplification (FE-12)
- Removed "All" button; now only Movies and TV Shows toggle buttons
- Behavior: no button selected = show all (default); clicking a button toggles it on (colored) or off (colorless)
- Single-select per type category (radio behavior within Movies/TV)
- Filter applied only when corresponding button is colored
- Cleaner UI consistent with library page toggle pattern
- Commit: 9a9d427

### Navbar UI Polish (FE-09)
- Confirmed spacing between navigation links: 2rem gap (adequate)
- Added text-transform: capitalize to username for proper capitalization
- Changed logout button hover effect: from generic opacity to red (#ef4444)
- Provides clearer visual feedback on hover action
- Commit: a66968c

### Navbar Complete Redesign (FE-09)
- **Layout**: Navigation links left-aligned, user info and logout right-aligned
- **Spacing**: 2rem gap between nav links, proper container max-width (1200px)
- **Styling**: 
  * Sticky positioning with subtle box-shadow
  * Rounded hover backgrounds for links
  * Active page indicated by bottom border accent (blue)
  * Username automatically capitalized (CSS text-transform)
  * Logout button: red (#ef4444) on hover
- **Responsive**: Adjusted spacing for mobile (<768px)
- Professional, clean appearance
- Commit: f097a29
