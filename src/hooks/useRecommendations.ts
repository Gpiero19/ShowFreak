import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, Recommendation } from '../types'

interface RecommendationResponse {
  items: Recommendation[]
  basedOn: string
}

export function useRecommendations(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['recommendations', limit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<ApiResponse<RecommendationResponse>>(`/recommendations?page=${pageParam}&limit=${limit}`)
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch recommendations')
      }
      return response.data.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.items.length < limit) return undefined
      return allPages.length + 1
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })
}