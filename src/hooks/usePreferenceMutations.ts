import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { CreatePreferenceDto } from '../types'

export function usePreferenceMutations() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: (dto: CreatePreferenceDto) =>
      api.post<{ success: boolean; data: any }>('/preferences', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean }>(`/preferences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  return {
    addDislike: addMutation.mutateAsync,
    removeDislike: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}