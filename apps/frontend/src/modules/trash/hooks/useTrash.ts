import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import trashService from '../services/trashService';
import type { Leaf } from '../../leaves/types';

export function useTrash() {
  return useQuery({
    queryKey: ['trash'],
    queryFn: () => trashService.getTrash(),
    staleTime: 30_000,
  });
}

export function useSoftDeleteNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notebookId: string) => trashService.softDeleteNotebook(notebookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useSoftDeleteLeaf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leafId: string) => trashService.softDeleteLeaf(leafId),
    onSuccess: (_, leafId) => {
      // ⚡ Remove a folha do cache da sidebar e do pai
      const leafData = queryClient.getQueryData<Leaf>(["leaves", leafId]);
      if (leafData) {
        // Remove da lista da sidebar
        queryClient.setQueryData<Leaf[]>(
          ["notebooks", leafData.notebookId, "leaves"],
          (old: Leaf[] | undefined) => old?.filter((l: Leaf) => l.id !== leafId) ?? old,
        );
        // Decrementa contagem de folhas
        queryClient.setQueryData(
          ["notebooks", leafData.notebookId],
          (old: { leavesCount: number } | undefined) => {
            if (!old) return old;
            return { ...old, leavesCount: Math.max(0, old.leavesCount - 1) };
          },
        );
        // Remove do array children da folha pai
        if (leafData.parentId) {
          queryClient.setQueryData<Leaf>(
            ["leaves", leafData.parentId],
            (old: Leaf | undefined) => {
              if (!old) return old;
              return {
                ...old,
                children: (old.children ?? []).filter((c: Leaf) => c.id !== leafId),
              };
            },
          );
        }
        queryClient.removeQueries({ queryKey: ["leaves", leafId] });
        queryClient.removeQueries({ queryKey: ["leaves", leafId, "summary"] });
      }

      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useRestoreNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notebookId: string) => trashService.restoreNotebook(notebookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useRestoreLeaf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leafId: string) => trashService.restoreLeaf(leafId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function usePermanentDeleteNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notebookId: string) => trashService.permanentDeleteNotebook(notebookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function usePermanentDeleteLeaf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leafId: string) => trashService.permanentDeleteLeaf(leafId),
    onSuccess: (_, leafId) => {
      // ⚡ Remove a folha do cache da sidebar e do pai
      const leafData = queryClient.getQueryData<Leaf>(["leaves", leafId]);
      if (leafData) {
        queryClient.setQueryData<Leaf[]>(
          ["notebooks", leafData.notebookId, "leaves"],
          (old: Leaf[] | undefined) => old?.filter((l: Leaf) => l.id !== leafId) ?? old,
        );
        if (leafData.parentId) {
          queryClient.setQueryData<Leaf>(
            ["leaves", leafData.parentId],
            (old: Leaf | undefined) => {
              if (!old) return old;
              return {
                ...old,
                children: (old.children ?? []).filter((c: Leaf) => c.id !== leafId),
              };
            },
          );
        }
        queryClient.removeQueries({ queryKey: ["leaves", leafId] });
        queryClient.removeQueries({ queryKey: ["leaves", leafId, "summary"] });
      }

      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useCleanTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => trashService.cleanOldTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}
