import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { ApiResponse, UserPreference, CreatePreferenceDto } from '../types'

export function usePreferences() {
  const queryClient = useQueryClient()

  // Fetch user preferences
  const { data, isLoading, error } = useQuery<ApiResponse<UserPreference[]>>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<UserPreference[]>>('/preferences')
      return response.data
    },
    retry: 1,
  })

  // Mutation to add a preference (dislike)
  const addPreference = useMutation({
    mutationFn: (dto: CreatePreferenceDto) => 
      api.post<ApiResponse<UserPreference>>('/preferences', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })

  // Mutation to remove a preference (dislike)
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