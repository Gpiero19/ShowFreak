import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="search-page">
      <h1>Search</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search movies and TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  )
}
