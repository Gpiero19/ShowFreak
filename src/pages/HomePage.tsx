import { useState, useEffect, useRef, useCallback } from 'react'
import { useRecommendations } from '../hooks/useRecommendations'
import { usePreferences } from '../hooks/usePreferences'
import { ContentCard } from '../components/search/ContentCard'
import { ContentType } from '../types'

export default function HomePage() {
  useEffect(() => { document.title = 'ShowFreak — Home' }, [])
  const [activeType, setActiveType] = useState<ContentType | ''>('')
  const { preferences } = usePreferences()
  
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecommendations(20)

  // Accumulate all items from all fetched pages
  const allItems = data?.pages.flatMap(page => page.items) || []

  // Filter items by type
  const filteredItems = activeType 
    ? allItems.filter(item => item.contentType === activeType)
    : allItems

  // Intersection Observer for infinite scroll
  const observer = useRef<IntersectionObserver>()
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    // Clean up any existing observer
    if (observer.current) observer.current.disconnect()

    // If no node or already fetching next page, skip setting up observer
    if (!node || isFetchingNextPage) return

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage()
      }
    }, { threshold: 0.1 })

    observer.current.observe(node)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])
  const toggleType = (type: ContentType) => {
    setActiveType(prev => prev === type ? '' : type)
  }

  return (
    <div className="home-page">
      <section>
        <h2>Recommended for You</h2>
        
        {/* Type toggle buttons */}
        <div className="toggle-group" style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`toggle-btn ${activeType === ContentType.MOVIE ? 'active-movie' : ''}`}
            onClick={() => toggleType(ContentType.MOVIE)}
          >
            Movies
          </button>
          <button
            type="button"
            className={`toggle-btn ${activeType === ContentType.TV ? 'active-tv' : ''}`}
            onClick={() => toggleType(ContentType.TV)}
          >
            TV Shows
          </button>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error loading recommendations</p>
        ) : (
          <>
            <div className="content-grid">
              {filteredItems.map((item, index) => {
                const pref = preferences.find(p => p.externalId === item.externalId && p.contentType === item.contentType)
                const cardProps = { content: item, isDisliked: !!pref, preferenceId: pref?.id }
                if (filteredItems.length === index + 1) {
                  return (
                    <div ref={lastItemRef} key={item.externalId}>
                      <ContentCard {...cardProps} />
                    </div>
                  )
                }
                return <ContentCard key={item.externalId} {...cardProps} />
              })}
            </div>

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="loading-more" style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading more recommendations...</p>
              </div>
            )}

            {/* No more content message */}
            {!hasNextPage && filteredItems.length > 0 && (
              <div className="no-more" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p>You've seen all recommendations for now. Check back later!</p>
              </div>
            )}

            {/* Empty state for filter */}
            {filteredItems.length === 0 && !isLoading && !error && (
              <p>No recommendations available for this filter. Try a different selection or add more content to your library!</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}