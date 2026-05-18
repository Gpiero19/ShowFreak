import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, UserPreference, CreatePreferenceDto } from '../types'

export function usePreferences() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<ApiResponse<UserPreference[]>>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<UserPreference[]>>('/preferences')
      return response.data
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const addPreference = useMutation({
    mutationFn: (dto: CreatePreferenceDto) => 
      api.post<ApiResponse<UserPreference>>('/preferences', dto),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })

  const removePreference = useMutation({
    mutationFn: (id: string) => 
      api.delete<ApiResponse<void>>(`/preferences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })

  return {
    preferences: data?.data || [],
    isLoading,
    error,
    addPreference,
    removePreference,
  }
}
