import { useRecommendations } from '../hooks/useRecommendations'
import { ContentCard } from '../components/search/ContentCard'

export default function HomePage() {
  const { data, isLoading, error } = useRecommendations()

  return (
    <div className="home-page">
      <h1>ShowFreak</h1>
      <section>
        <h2>Recommended for You</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error loading recommendations</p>
        ) : (
          <div className="content-grid">
            {data?.items.map((item) => (
              <ContentCard key={item.externalId} content={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
