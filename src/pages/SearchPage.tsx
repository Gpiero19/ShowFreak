import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { contentApi } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [type, setType] = useState(searchParams.get('type') || 'movie')

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query, type],
    queryFn: () => contentApi.search(query, type),
    enabled: query.length > 0,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: query, type })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      
      <form onSubmit={handleSearch} className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies or TV shows..."
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <LoadingSpinner />}

      {error && <div className="text-red-500">Search failed</div>}

      {data?.data?.results?.length === 0 && query && !isLoading && (
        <p className="text-gray-500">No results found</p>
      )}

      {data?.data?.results?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.data.results.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {item.poster_path ? (
                <img
                  src={item.poster_path}
                  alt={item.title || item.name}
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">No Image</div>
              )}
              <div className="p-3">
                <h3 className="font-semibold truncate">{item.title || item.name}</h3>
                <p className="text-sm text-gray-500">
                  {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
