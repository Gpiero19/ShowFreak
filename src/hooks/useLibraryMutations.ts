import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { LibraryItem, CreateLibraryItemDto, UpdateLibraryItemDto } from '../types'

export function useLibraryMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (dto: CreateLibraryItemDto) =>
      api.post<{ success: boolean; data: LibraryItem }>('/library', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...dto }: UpdateLibraryItemDto & { id: string }) =>
      api.patch<{ success: boolean; data: LibraryItem }>(`/library/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean }>(`/library/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  return {
    addToLibrary: createMutation.mutateAsync,
    updateLibraryItem: updateMutation.mutateAsync,
    removeFromLibrary: deleteMutation.mutateAsync,
    isAdding: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}