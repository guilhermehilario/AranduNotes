import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bookmarkService from '../services/bookmarkService';
import type { Bookmark } from '../types';

export function useBookmarks() {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => bookmarkService.getBookmarks(),
    staleTime: 30_000,
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      leafId?: string;
      notebookId?: string;
      title: string;
      path: string;
    }) => bookmarkService.createBookmark(data),
    onSuccess: (newBookmark) => {
      queryClient.setQueryData<Bookmark[]>(['bookmarks'], (old) => {
        if (!old) return [newBookmark];
        const exists = old.some((b) => b.id === newBookmark.id);
        return exists ? old : [newBookmark, ...old];
      });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarkService.deleteBookmark(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Bookmark[]>(['bookmarks'], (old) =>
        old?.filter((b) => b.id !== id) ?? old,
      );
    },
  });
}
