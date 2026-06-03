import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ContentCard } from '../components/search/ContentCard'
import { ApiResponse, PaginatedResponse, ContentSearchResult } from '../types'
import { usePreferences } from '../hooks/usePreferences'

interface SearchResponseData {
  data: PaginatedResponse<ContentSearchResult>
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Get query from URL params if available
  const urlQuery = searchParams.get('q') || ''
  
  // Initialize form state with URL query
  const [formQuery, setFormQuery] = useState(urlQuery)
  
  const { preferences } = usePreferences()

  const { data, isLoading, error } = useQuery<ApiResponse<PaginatedResponse<ContentSearchResult>>>({
    queryKey: ['search', formQuery],
    queryFn: async () => {
      if (!formQuery.trim()) {
        return { data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }, success: true }
      }
      const response = await api.get<ApiResponse<PaginatedResponse<ContentSearchResult>>>(`/content/search?q=${encodeURIComponent(formQuery)}`)
      return response.data
    },
    enabled: !!formQuery.trim(),
    retry: 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(formQuery)}`)
    }
  }

  return (
    <div className="search-page">
      <h1>Search</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search movies and TV shows..."
          value={formQuery}
          onChange={(e) => setFormQuery(e.target.value)}
          className="filter-input"
        />
        <button type="submit" className="toggle-btn">
          Search
        </button>
      </form>
      
      {isLoading && formQuery ? (
        <p>Loading search results...</p>
      ) : error && formQuery ? (
        <p>Error loading search results</p>
      ) : formQuery ? (
        <div className="search-results">
          {data?.data.data && data.data.data.length > 0 ? (
            <div className="content-grid">
              {data.data.data.map((item) => {
                const pref = preferences.find(p => p.externalId === item.externalId && p.contentType === item.contentType)
                return (
                  <ContentCard
                    key={item.externalId}
                    content={item}
                    isDisliked={!!pref}
                    preferenceId={pref?.id}
                  />
                )
              })}
            </div>
          ) : (
            <p>No results found for "{formQuery}". Try a different search.</p>
          )}
        </div>
      ) : (
        <p>Enter a search term to find movies and TV shows.</p>
      )}
    </div>
  )
}
