import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import tagService from '../services/tagService';
import type { Tag } from '../types';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
    staleTime: 60_000,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => tagService.createTag(data),
    onSuccess: (newTag) => {
      queryClient.setQueryData<Tag[]>(['tags'], (old) => [...(old || []), newTag]);
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      tagService.updateTag(id, data),
    onSuccess: (updatedTag) => {
      queryClient.setQueryData<Tag[]>(['tags'], (old) =>
        old?.map((t) => (t.id === updatedTag.id ? updatedTag : t)) ?? old,
      );
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagService.deleteTag(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Tag[]>(['tags'], (old) => old?.filter((t) => t.id !== id) ?? old);
    },
  });
}

export function useLeafTags(leafId: string) {
  return useQuery({
    queryKey: ['leaves', leafId, 'tags'],
    queryFn: () => tagService.getLeafTags(leafId),
    enabled: !!leafId,
    staleTime: 30_000,
  });
}

export function useAddTagToLeaf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leafId, tagId }: { leafId: string; tagId: string }) =>
      tagService.addTagToLeaf(leafId, tagId),
    onSuccess: (_, { leafId }) => {
      queryClient.invalidateQueries({ queryKey: ['leaves', leafId, 'tags'] });
    },
  });
}

export function useRemoveTagFromLeaf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leafId, tagId }: { leafId: string; tagId: string }) =>
      tagService.removeTagFromLeaf(leafId, tagId),
    onSuccess: (_, { leafId }) => {
      queryClient.invalidateQueries({ queryKey: ['leaves', leafId, 'tags'] });
    },
  });
}
