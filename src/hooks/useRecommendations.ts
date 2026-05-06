import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, Recommendation } from '../types'

interface RecommendationResponse {
  items: Recommendation[]
  basedOn: string
}

export function useRecommendations(limit = 20) {
  return useQuery({
    queryKey: ['recommendations', limit],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RecommendationResponse>>(`/recommendations?limit=${limit}`)
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch recommendations')
      }
      return response.data.data
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })
}