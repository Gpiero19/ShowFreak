import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import { usePreferences } from '../hooks/usePreferences'
import { LibraryStatus, ContentType, SortField, SortOrder } from '../types'
import { ContentCard } from '../components/search/ContentCard'

export default function LibraryPage() {
  const navigate = useNavigate()
  const [activeStatuses, setActiveStatuses] = useState<LibraryStatus[]>([])
  const [activeTypes, setActiveTypes] = useState<ContentType[]>([])
  const [showDislikes, setShowDislikes] = useState(false)
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState<SortField>(SortField.CREATED_AT)
  const [order, setOrder] = useState<SortOrder>(SortOrder.DESC)
  const [search, setSearch] = useState('')
  const [minImdbRating, setMinImdbRating] = useState('')
  const [minPersonalRating, setMinPersonalRating] = useState('')

  // When showing dislikes, clear other filters
  useEffect(() => {
    if (showDislikes) {
      setActiveStatuses([])
      setActiveTypes([])
      setSearch('')
      setGenre('')
    }
  }, [showDislikes])

  // Toggle status filter (single selection only) - clears dislikes view
  const toggleStatus = (status: LibraryStatus) => {
    setShowDislikes(false)
    setActiveStatuses(prev =>
      prev.includes(status) ? [] : [status]
    )
  }

  // Toggle type filter (single selection only) - clears dislikes view
  const toggleType = (type: ContentType) => {
    setShowDislikes(false)
    setActiveTypes(prev =>
      prev.includes(type) ? [] : [type]
    )
  }

  const libraryParams = {
    status: activeStatuses.length > 0 ? activeStatuses[0] : undefined,
    type: activeTypes.length > 0 ? activeTypes[0] : undefined,
    genre: genre || undefined,
    sort,
    order,
    q: search || undefined,
    minImdbRating: minImdbRating ? parseFloat(minImdbRating) : undefined,
    minPersonalRating: minPersonalRating ? parseFloat(minPersonalRating) : undefined,
    page: 1,
    limit: 20,
  }

  const { data, isLoading, error } = useLibrary(libraryParams)
  
  // Fetch dislikes
  const { data: preferencesData, isLoading: isLoadingDislikes, error: dislikesError } = usePreferences()
  const dislikes = preferencesData?.data || []

  // Toggle dislike view - clears other filters
  const handleToggleDislikes = () => {
    const newValue = !showDislikes
    setShowDislikes(newValue)
    if (newValue) {
      // When entering dislikes view, clear other filters
      setActiveStatuses([])
      setActiveTypes([])
      setSearch('')
    }
  }

  return (
    <div className="library-page">
      <h1>My Library</h1>
      <div className="filters">
        {/* Status toggle buttons */}
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${activeStatuses.includes(LibraryStatus.WATCHED) ? 'active-watched' : ''}`}
            onClick={() => toggleStatus(LibraryStatus.WATCHED)}
          >
            Watched
          </button>
          <button
            type="button"
            className={`toggle-btn ${activeStatuses.includes(LibraryStatus.FAVORITE) ? 'active-favorite' : ''}`}
            onClick={() => toggleStatus(LibraryStatus.FAVORITE)}
          >
            Favorite
          </button>
          <button
            type="button"
            className={`toggle-btn ${activeStatuses.includes(LibraryStatus.WISHLIST) ? 'active-wishlist' : ''}`}
            onClick={() => toggleStatus(LibraryStatus.WISHLIST)}
          >
            Wishlist
          </button>
          <button
            type="button"
            className={`toggle-btn ${showDislikes ? 'active-dislike' : ''}`}
            onClick={handleToggleDislikes}
            style={{ position: 'relative' }}
          >
            Disliked
            {dislikes.length > 0 && !showDislikes && (
              <span style={{
                position: 'absolute',
                top: '-0.25rem',
                right: '-0.25rem',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '9999px',
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}>
                {dislikes.length}
              </span>
            )}
          </button>
        </div>

        {/* Type toggle buttons */}
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${activeTypes.includes(ContentType.MOVIE) ? 'active-movie' : ''}`}
            onClick={() => toggleType(ContentType.MOVIE)}
          >
            Movies
          </button>
          <button
            type="button"
            className={`toggle-btn ${activeTypes.includes(ContentType.TV) ? 'active-tv' : ''}`}
            onClick={() => toggleType(ContentType.TV)}
          >
            TV Shows
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
          disabled={showDislikes}
        />

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="number"
            placeholder="Min IMDb rating"
            min="0"
            max="10"
            step="0.1"
            value={minImdbRating}
            onChange={(e) => setMinImdbRating(e.target.value)}
            className="filter-input"
            style={{ width: '160px' }}
            disabled={showDislikes}
          />
          <input
            type="number"
            placeholder="Min your rating"
            min="1"
            max="5"
            step="1"
            value={minPersonalRating}
            onChange={(e) => setMinPersonalRating(e.target.value)}
            className="filter-input"
            style={{ width: '160px' }}
            disabled={showDislikes}
          />
        </div>
      </div>
      
      {showDislikes ? (
        // Show disliked content
        isLoadingDislikes ? (
          <p>Loading dislikes...</p>
        ) : dislikesError ? (
          <p style={{ color: 'red' }}>Error loading dislikes. Please try again.</p>
        ) : dislikes.length > 0 ? (
          <div className="library-content">
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Showing {dislikes.length} disliked item{dislikes.length !== 1 ? 's' : ''}. 
              These are excluded from recommendations.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '1rem'
            }}>
              {dislikes.map((pref) => (
                <div
                  key={pref.id}
                  className="content-card"
                  onClick={() => navigate(`/details/${pref.externalId}?type=${pref.contentType}`)}
                >
                  {pref.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${pref.posterPath}`}
                      alt={pref.title ?? pref.externalId}
                    />
                  ) : (
                    <div style={{
                      backgroundColor: '#374151',
                      aspectRatio: '2/3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      fontSize: '0.75rem',
                    }}>
                      No image
                    </div>
                  )}
                  <h3 style={{ marginBottom: '0.125rem' }}>
                    {pref.title ?? pref.externalId}
                  </h3>
                  <p style={{ margin: '0 0 0.125rem 0', color: '#9ca3af' }}>
                    {pref.releaseYear ?? ''} · {pref.contentType === 'movie' ? 'Movie' : 'TV Show'}
                  </p>
                  {pref.dislikeReason && (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.75rem' }}>
                      {pref.dislikeReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: '#9ca3af' }}>
            You haven't disliked any content yet. Click the × button on any content to add it to dislikes.
          </p>
        )
      ) : (
        // Show normal library
        isLoading ? (
          <p>Loading library...</p>
        ) : error ? (
          <p>Error loading library</p>
        ) : (
          <div className="library-content">
            {data?.data.data && data.data.data.length > 0 ? (
              <div className="content-grid">
                {data.data.data.map((item) => {
                  const pref = dislikes.find(p => p.externalId === item.externalId && p.contentType === item.contentType)
                  return (
                    <ContentCard
                      key={item.id}
                      content={item}
                      isDisliked={!!pref}
                      preferenceId={pref?.id}
                    />
                  )
                })}
              </div>
            ) : (
              <p>Your library is empty. Add some content to get started!</p>
            )}
          </div>
        )
      )}
    </div>
  )
}
