import { Link } from 'react-router-dom'

interface ContentCardProps {
  id: string
  title: string
  posterPath: string | null
  releaseYear?: number
  voteAverage?: number
  contentType?: 'movie' | 'tv'
}

export function ContentCard({ id, title, posterPath, releaseYear, voteAverage, contentType = 'movie' }: ContentCardProps) {
  return (
    <Link to={`/details/${contentType}/${id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {posterPath ? (
          <img
            src={posterPath}
            alt={title}
            className="w-full h-auto"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        <div className="p-3">
          <h3 className="font-semibold truncate">{title}</h3>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">{releaseYear || 'N/A'}</p>
            {voteAverage && (
              <span className="text-sm text-yellow-500">★ {voteAverage.toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
