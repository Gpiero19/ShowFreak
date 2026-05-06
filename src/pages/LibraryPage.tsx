import { useState } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { LibraryStatus, ContentType, SortField, SortOrder } from '../types'
import { ContentCard } from '../components/search/ContentCard'

export default function LibraryPage() {
  const [status, setStatus] = useState<LibraryStatus | ''>('')
  const [type, setType] = useState<ContentType | ''>('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState<SortField>(SortField.CREATED_AT)
  const [order, setOrder] = useState<SortOrder>(SortOrder.DESC)
  const [search, setSearch] = useState('')

  const libraryParams = {
    status: status || undefined,
    type: type || undefined,
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
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value as LibraryStatus)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value={LibraryStatus.WATCHED}>Watched</option>
          <option value={LibraryStatus.FAVORITE}>Favorite</option>
          <option value={LibraryStatus.WISHLIST}>Wishlist</option>
        </select>
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value as ContentType)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value={ContentType.MOVIE}>Movies</option>
          <option value={ContentType.TV}>TV Shows</option>
        </select>
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
