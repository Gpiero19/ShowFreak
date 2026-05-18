import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, PaginatedResponse, LibraryItem, LibraryQueryParams } from '../types'

export function useLibrary(params: LibraryQueryParams = {}) {
  return useQuery<ApiResponse<PaginatedResponse<LibraryItem>>>({
    queryKey: ['library', params],
    queryFn: async () => {
      // Build query string from params
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.order) queryParams.append('order', params.order)
      if (params.q) queryParams.append('q', params.q)
      if (params.genre) queryParams.append('genre', params.genre)
      if (params.status) queryParams.append('status', params.status)
      if (params.type) queryParams.append('type', params.type)
      if (params.minImdbRating) queryParams.append('minImdbRating', params.minImdbRating.toString())
      if (params.minPersonalRating) queryParams.append('minPersonalRating', params.minPersonalRating.toString())

      const queryString = queryParams.toString()
      const url = `/library${queryString ? `?${queryString}` : ''}`

      const response = await api.get<ApiResponse<PaginatedResponse<LibraryItem>>>(url)
      return response.data
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}