import { useState } from 'react'
import { LibraryStatus, ContentType, SortField, SortOrder } from '../types'

export default function LibraryPage() {
  const [status, setStatus] = useState<LibraryStatus | ''>('')
  const [type, setType] = useState<ContentType | ''>('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState<SortField>(SortField.CREATED_AT)
  const [order, setOrder] = useState<SortOrder>(SortOrder.DESC)
  const [search, setSearch] = useState('')

  return (
    <div className="library-page">
      <h1>My Library</h1>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value as LibraryStatus)}>
          <option value="">All Status</option>
          <option value={LibraryStatus.WATCHED}>Watched</option>
          <option value={LibraryStatus.FAVORITE}>Favorite</option>
          <option value={LibraryStatus.WISHLIST}>Wishlist</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as ContentType)}>
          <option value="">All Types</option>
          <option value={ContentType.MOVIE}>Movies</option>
          <option value={ContentType.TV}>TV Shows</option>
        </select>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <p>Library content will appear here</p>
    </div>
  )
}
