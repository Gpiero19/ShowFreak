import { useNavigate } from 'react-router-dom'
import { ContentSearchResult, ContentType, LibraryItem, Recommendation } from '../../types'
import { usePreferenceMutations } from '../../hooks/usePreferenceMutations'
import { usePreferences } from '../../hooks/usePreferences'

interface ContentCardProps {
  content: ContentSearchResult | LibraryItem | Recommendation
}

export function ContentCard({ content }: ContentCardProps) {
  const navigate = useNavigate()
  const { addDislike, removeDislike, isAdding, isRemoving } = usePreferenceMutations()
  const { preferences, isLoading: isLoadingPrefs } = usePreferences()

  // Normalize externalId to string for comparison
  const contentExternalId = String(content.externalId)
  const contentType = content.contentType

  const isDisliked = !isLoadingPrefs && preferences.some(
    (pref) => String(pref.externalId) === contentExternalId && pref.contentType === contentType
  )

  const handleDislikeClick = async (e: React.MouseEvent) => {
    // Stop event from bubbling to the card click handler
    e.preventDefault()
    e.stopPropagation()
    
    if (isAdding || isRemoving) return
    
    try {
      if (isDisliked) {
        const pref = preferences.find(
          (p) => String(p.externalId) === contentExternalId && p.contentType === contentType
        )
        if (pref) {
          await removeDislike(pref.id)
        }
      } else {
        await addDislike({
          externalId: contentExternalId,
          contentType: contentType,
        })
      }
    } catch (error: any) {
      console.error('Dislike action failed:', error)
    }
  }

  const handleCardClick = () => {
    navigate(`/details/${contentExternalId}?type=${contentType}`)
  }

  if (isLoadingPrefs) {
    return (
      <div className="content-card" onClick={handleCardClick}>
        <div style={{ position: 'relative' }}>
          {content.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w500${content.posterPath}`}
              alt={content.title}
            />
          )}
        </div>
        <h3>{content.title}</h3>
        <p>{content.releaseYear}</p>
      </div>
    )
  }

  return (
    <div
      className="content-card"
      onClick={handleCardClick}
    >
      <div style={{ position: 'relative' }}>
        {content.posterPath && (
          <img
            src={`https://image.tmdb.org/t/p/w500${content.posterPath}`}
            alt={content.title}
          />
        )}
        {content.voteAverage && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#fbbf24',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.8125rem',
            fontWeight: 'bold',
          }}>
            ★ {content.voteAverage.toFixed(1)}
          </div>
        )}
        <button
          type="button"
          onClick={handleDislikeClick}
          disabled={isAdding || isRemoving}
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.5rem',
            backgroundColor: isDisliked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
          title={isDisliked ? 'Remove from dislikes' : 'Add to dislikes'}
        >
          ×
        </button>
      </div>
      <h3 style={{ marginBottom: '0.125rem' }}>{content.title}</h3>
      <p style={{ margin: '0 0 0.125rem 0', color: '#9ca3af' }}>{content.releaseYear}</p>
      {'personalRating' in content && content.personalRating !== null && (
        <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8125rem' }}>
          Your rating: {content.personalRating} ★
        </span>
      )}
    </div>
  )
}
