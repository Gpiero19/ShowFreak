import { useState } from 'react'
import { useRecommendations } from '../hooks/useRecommendations'
import { ContentCard } from '../components/search/ContentCard'
import { ContentType } from '../types'

export default function HomePage() {
  const [activeType, setActiveType] = useState<ContentType | ''>('')
  
  const { data, isLoading, error } = useRecommendations(20)

  // Filter recommendations by type if a type is selected
  const filteredItems = data?.items?.filter(item => {
    if (!activeType) return true
    return item.contentType === activeType
  }) || []

  return (
    <div className="home-page">
      <h1>ShowFreak</h1>
      <section>
        <h2>Recommended for You</h2>
        
        {/* Type toggle buttons */}
        <div className="toggle-group" style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`toggle-btn ${activeType === '' ? 'active-all' : ''}`}
            onClick={() => setActiveType('')}
          >
            All
          </button>
          <button
            type="button"
            className={`toggle-btn ${activeType === ContentType.MOVIE ? 'active-movie' : ''}`}
            onClick={() => setActiveType(ContentType.MOVIE)}
          >
            Movies
          </button>
          <button
            type="button"
            className={`toggle-btn ${activeType === ContentType.TV ? 'active-tv' : ''}`}
            onClick={() => setActiveType(ContentType.TV)}
          >
            TV Shows
          </button>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error loading recommendations</p>
        ) : (
          <div className="content-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ContentCard key={item.externalId} content={item} />
              ))
            ) : (
              <p>No recommendations available yet. Add content to your library to get personalized recommendations!</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
