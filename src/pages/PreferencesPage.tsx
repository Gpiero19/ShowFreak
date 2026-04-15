import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { preferencesApi } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Button } from '../components/Button'

export function PreferencesPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => preferencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">Failed to load preferences</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Preferences</h1>
      <p className="text-gray-600 mb-6">
        These are items you've marked as dislike. We won't recommend similar content.
      </p>

      {data?.data?.length === 0 ? (
        <p className="text-gray-500">No preferences yet.</p>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.externalId}</p>
                <p className="text-sm text-gray-500">
                  {item.contentType}
                  {item.dislikeReason && ` • ${item.dislikeReason}`}
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
