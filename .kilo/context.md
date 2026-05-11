# Session Context

## Completed Tasks (2026-05-11)
- All main pages (Home, Search, Details, Library, Preferences) fully implemented with API integration
- Navbar component (authenticated-only, full-width)
- Backend TMDB service and content controller integration
- Library controller fixed with proper Prisma queries and type handling
- Details page enhanced with library management (rating, notes, add/update/remove) and dislike functionality
- Custom hooks: useLibrary, usePreferences, useLibraryMutations, usePreferenceMutations, useLibraryItem

## Next Tasks
- Add toast notifications for user feedback (FE-20 already DONE, but needs integration)
- Pagination/infinite scroll (FE-21 already DONE, but needs integration)
- Write unit/integration tests (new task)
- Accessibility audit and fixes (new task)
- Deploy to production (new task)

## Important Discoveries
- Composite key pattern: use `externalId_contentType` compound unique in where clauses
- Always convert Prisma Decimal to Number, Json to proper array types
- Axios baseURL `/api` requires endpoint paths without leading `/api`
- React Query invalidation after mutations critical for consistency
- Use `useEffect` for syncing state from query results

### Additional Completed (2026-05-11)
- Library page filter UI enhanced with toggle buttons (FE-16)
  * Status toggles: Watched (orange), Favorite (green), Wishlist (blue)
  * Type toggles: Movies (purple), TV Shows (red)
  * Inactive buttons are colorless; active buttons colored
  * Multiple selections per category (OR logic)

### Git Commits (additional)
- 785c7d4: feat: replace library filter dropdowns with toggle buttons

### Next Steps (updated)
- Ensure API supports multiple status/type filters (currently single only)
- Add toast notifications for filter changes (user feedback)
- Write unit/integration tests for new toggle logic
- Accessibility audit (button contrast, focus states)
- Deploy to production

### Additional Completed (2026-05-11) - continued
- Library status filter now single-select (radio behavior): only one of Watched/Favorite/Wishlist active at a time

### Git Commits (additional)
- ecb7b6f: feat: make library status filters single-select (radio behavior)

### Additional Completed (2026-05-11) - final
- Library type filter now single-select (radio behavior): only Movies OR TV Shows active at a time, matching status filter
- All filter toggle buttons now support exclusive selection per category

### Git Commits (final)
- 77dab3f: feat: make type filters (Movies/TV) single-select as well

### Major Completion - Recommendation System (REC-03, REC-04)
- Implemented full recommendation algorithm server-side:
  * **Genre preference**: Weights genres from watched items by personal rating (5★=3, 4★=2, 3★=1, unrated=0.5), selects top 3, queries TMDB discover
  * **Similar-to**: Returns TMDB similar items for a specific content ID
  * **Trending fallback**: Shows TMDB weekly trending when user has empty library
- Filters out disliked and already-in-library items
- Sorts by vote_average (≥6) for quality
- Recommendation type expanded to include `trending`
- Home page now displays real personalized recommendations

### All Core Features Complete
Per specs.md, all MVP features are now implemented:
- Browse & Search ✓
- Personal Library (watched, favorites, wishlist) ✓
- Library Management (filter, sort, search) ✓
- Preferences (dislikes) ✓
- Recommendations (genre-based, similar, trending) ✓

### Next Steps
- Add notifications/toasts for user actions
- Write comprehensive tests (unit + integration)
- Accessibility audit
- Performance optimization
- Deploy to production

### Bugfix (2026-05-11)
- Fixed empty recommendations on home page:
  * **Root cause**: Details endpoint cached genre names instead of IDs; recommendation algorithm requires IDs for TMDB discover
  * **Fix**: Cache genre IDs (from `g.id`) now; return genre names separately for frontend
  * **Added fallback**: If personalized recs empty, return trending to ensure UI always shows content
  * Result: Home page now displays real recommendations based on library or trending

### Files Modified
- server/src/controllers/content.controller.ts (details endpoint caching)
- server/src/services/recommendation.service.ts (fallback logic)

### Git Commits
- 777ded8: fix: store genre IDs in content_cache and add recommendation fallback

### Feature: Home Page Type Filter (FE-12)
- Added toggle buttons to filter recommendations by content type (All/Movies/TV Shows)
- Uses same toggle button styling as library page
- Single-select behavior: selecting one deselects others
- Client-side filtering of recommendation results
- Default shows all recommendations

### Git Commits
- b8b3f8c: feat: add Movie/TV toggle filter to home page recommendations
