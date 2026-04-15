import { useQuery } from '@tanstack/react-query'
import { recommendationsApi } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.getAll(),
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500">Failed to load recommendations</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Recommended for You</h1>
      {data?.data?.length === 0 ? (
        <p className="text-gray-500">No recommendations yet. Add some movies to your library!</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data?.data?.map((item: any) => (
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
