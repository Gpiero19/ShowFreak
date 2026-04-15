import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { contentApi, libraryApi } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Button } from '../components/Button'
import { useState } from 'react'

export function DetailsPage() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const [status, setStatus] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type || 'movie'),
  })

  const addToLibrary = async () => {
    if (!status) return
    try {
      await libraryApi.create({
        externalId: id!,
        contentType: type || 'movie',
        status,
      })
      alert('Added to library!')
    } catch (err: any) {
      alert(err.message || 'Failed to add')
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">Failed to load content</div>

  const content = data?.data

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-6">
        {content?.poster_path && (
          <img
            src={content.poster_path}
            alt={content.title || content.name}
            className="w-64 rounded-lg"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{content?.title || content?.name}</h1>
          <p className="text-gray-500 mt-1">
            {content?.release_date?.split('-')[0] || content?.first_air_date?.split('-')[0]}
          </p>
          {content?.vote_average && (
            <p className="text-yellow-500 mt-2">★ {content.vote_average.toFixed(1)} / 10</p>
          )}
          <p className="mt-4">{content?.overview}</p>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Add to Library</h3>
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select status...</option>
                <option value="wishlist">Wishlist</option>
                <option value="watched">Watched</option>
                <option value="favorite">Favorite</option>
              </select>
              <Button onClick={addToLibrary} disabled={!status}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
