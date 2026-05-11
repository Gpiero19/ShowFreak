import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, LibraryItem } from '../types'

export function useLibraryItem(externalId: string) {
  return useQuery<ApiResponse<LibraryItem[]>>({
    queryKey: ['libraryItem', externalId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LibraryItem[]>>(`/library?externalId=${externalId}&limit=1`)
      return response.data
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !!externalId,
  })
}