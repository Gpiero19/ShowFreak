import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { libraryApi } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Button } from '../components/Button'

export function LibraryPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['library', statusFilter, typeFilter],
    queryFn: () => libraryApi.getAll({ status: statusFilter, type: typeFilter }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => libraryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">Failed to load library</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Library</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="wishlist">Wishlist</option>
          <option value="watched">Watched</option>
          <option value="favorite">Favorite</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
      </div>

      {data?.data?.length === 0 ? (
        <p className="text-gray-500">Your library is empty. Start adding movies!</p>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
              {item.contentCache?.posterPath && (
                <img
                  src={item.contentCache.posterPath}
                  alt={item.contentCache.title}
                  className="w-16 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{item.contentCache?.title || 'Unknown'}</h3>
                <p className="text-sm text-gray-500">
                  {item.contentType} • {item.status}
                  {item.personalRating && ` • ★ ${item.personalRating}`}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
