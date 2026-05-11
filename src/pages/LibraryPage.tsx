import { useState } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { LibraryStatus, ContentType, SortField, SortOrder } from '../types'
import { ContentCard } from '../components/search/ContentCard'

export default function LibraryPage() {
  const [activeStatuses, setActiveStatuses] = useState<LibraryStatus[]>([])
  const [activeTypes, setActiveTypes] = useState<ContentType[]>([])
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState<SortField>(SortField.CREATED_AT)
  const [order, setOrder] = useState<SortOrder>(SortOrder.DESC)
  const [search, setSearch] = useState('')

  // Toggle status filter (single selection only)
  const toggleStatus = (status: LibraryStatus) => {
    setActiveStatuses(prev =>
      prev.includes(status) ? [] : [status]
    )
  }

  // Toggle type filter
  const toggleType = (type: ContentType) => {
    setActiveTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const libraryParams = {
    status: activeStatuses.length > 0 ? activeStatuses[0] : undefined, // API expects single status for now
    type: activeTypes.length > 0 ? activeTypes[0] : undefined, // API expects single type for now
    genre: genre || undefined,
    sort,
    order,
    q: search || undefined,
    page: 1,
    limit: 20,
  }

  const { data, isLoading, error } = useLibrary(libraryParams)

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
        />
      </div>
      
      {isLoading ? (
        <p>Loading library...</p>
      ) : error ? (
        <p>Error loading library</p>
      ) : (
        <div className="library-content">
          {data?.data.data && data.data.data.length > 0 ? (
            <div className="content-grid">
              {data.data.data.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          ) : (
            <p>Your library is empty. Add some content to get started!</p>
          )}
        </div>
      )}
    </div>
  )
}
