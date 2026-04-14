import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, PaginatedResponse, ContentSearchResult, Recommendation } from '../types'

export function useRecommendations(limit = 20) {
  return useQuery({
    queryKey: ['recommendations', limit],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ items: Recommendation[]; basedOn: string }>>(`/api/recommendations?limit=${limit}`)
      return response.data.data
    },
  })
}
