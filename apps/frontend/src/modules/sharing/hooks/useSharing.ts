import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sharingService from '../services/sharingService';
import type { ShareResourceType } from '../types';

export function useShares(resourceType: ShareResourceType, resourceId: string) {
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ['shares', resourceType, resourceId],
    queryFn: () => sharingService.listShares(resourceType, resourceId),
    enabled: !!resourceId,
  });

  const createMutation = useMutation({
    mutationFn: (email: string) =>
      sharingService.createShare(resourceType, resourceId, email),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['shares', resourceType, resourceId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (shareId: string) => sharingService.removeShare(shareId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['shares', resourceType, resourceId] }),
  });

  const setPublicMutation = useMutation({
    mutationFn: (isPublic: boolean) =>
      sharingService.setPublic(resourceType, resourceId, isPublic),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shares', resourceType, resourceId] });
      queryClient.setQueryData(
        ['shares', resourceType, resourceId, 'public'],
        result,
      );
    },
  });

  return {
    shares: sharesQuery.data || [],
    isLoadingShares: sharesQuery.isLoading,
    createShare: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    removeShare: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    setPublic: setPublicMutation.mutateAsync,
    isSettingPublic: setPublicMutation.isPending,
  };
}

export function useInbox() {
  return useQuery({
    queryKey: ['shares', 'inbox'],
    queryFn: () => sharingService.getInbox(),
  });
}