import { useNavigate } from 'react-router-dom'
import { ContentSearchResult, ContentType } from '../../types'

interface ContentCardProps {
  content: ContentSearchResult | {
    externalId: string
    contentType: ContentType
    title: string
    posterPath: string | null
    voteAverage: number | null
    releaseYear: number | null
  }
}

export function ContentCard({ content }: ContentCardProps) {
  const navigate = useNavigate()

  return (
    <div
      className="content-card"
      onClick={() => navigate(`/details/${content.externalId}?type=${content.contentType}`)}
    >
      {content.posterPath && (
        <img
          src={`https://image.tmdb.org/t/p/w500${content.posterPath}`}
          alt={content.title}
        />
      )}
      <h3>{content.title}</h3>
      <p>{content.releaseYear}</p>
      {content.voteAverage && <p>★ {content.voteAverage.toFixed(1)}</p>}
    </div>
  )
}
