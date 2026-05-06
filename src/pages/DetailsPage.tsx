import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, ContentDetails } from '../types'

export default function DetailsPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') as 'movie' | 'tv' || 'movie'

  const { data, isLoading, error } = useQuery<ApiResponse<ContentDetails>>({
    queryKey: ['content', id, type],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ContentDetails>>(`/content/${id}?type=${type}`)
      return response.data
    },
    retry: 1,
  })

  return (
    <div className="details-page">
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error loading content details</p>
      ) : data?.data ? (
        <>
          <h1>{data.data.title}</h1>
          <div className="details-content">
            {data.data.posterPath && (
              <img
                src={`https://image.tmdb.org/t/p/w500${data.data.posterPath}`}
                alt={data.data.title}
                className="details-poster"
              />
            )}
            <div className="details-info">
              <h2>{data.data.title}</h2>
              <p className="details-release">{(data.data.releaseYear || 'N/A')} • {data.data.contentType.toUpperCase()}</p>
              {data.data.voteAverage && <p className="details-rating">★ {data.data.voteAverage.toFixed(1)}</p>}
              <p className="details-overview">{data.data.overview || 'No overview available.'}</p>
              {data.data.genres && data.data.genres.length > 0 && (
                <p className="details-genres">
                  <strong>Genres:</strong> {data.data.genres.join(', ')}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p>Content not found</p>
      )}
    </div>
  )
}
