import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import leafService from "../services/leafService";
import type { CreateLeafInput, UpdateLeafInput, Leaf } from "../types";
import type { Flashcard } from "../../study/types";

export function useLeaves(notebookId: string) {
  const queryClient = useQueryClient();

  const leavesQuery = useQuery({
    queryKey: ["notebooks", notebookId, "leaves"],
    queryFn: () => leafService.getLeaves(notebookId),
    enabled: !!notebookId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeafInput) =>
      leafService.createLeaf(notebookId, data),
    onSuccess: (newLeaf) => {
      // ⚡ Adiciona a nova folha ao cache + incrementa contagem — sem refetch
      queryClient.setQueryData<Leaf[]>(
        ["notebooks", notebookId, "leaves"],
        (old: Leaf[] | undefined) => {
          if (!old) return [newLeaf];
          const alreadyExists = old.some((leaf: Leaf) => leaf.id === newLeaf.id);
          return alreadyExists ? old : [...old, newLeaf];
        },
      );
      queryClient.setQueryData(
        ["notebooks", notebookId],
        (old: { leavesCount: number } | undefined) => {
          if (!old) return old;
          return { ...old, leavesCount: old.leavesCount + 1 };
        },
      );

      // ⚡ Se for sub-folha, adiciona ao cache ['leaves', parentId]
      //    para que a folha pai mostre o novo filho sem recarregar.
      if (newLeaf.parentId) {
        queryClient.setQueryData<Leaf>(["leaves", newLeaf.parentId], (old: Leaf | undefined) => {
          if (!old) return old;
          const children = old.children ?? [];
          const alreadyExists = children.some((c: Leaf) => c.id === newLeaf.id);
          if (alreadyExists) return old;
          return {
            ...old,
            children: [
              ...children,
              { ...newLeaf, children: [], tags: [] } as Leaf,
            ],
          };
        });
      }
    },
  });

  return {
    leaves: leavesQuery.data || [],
    isLoading: leavesQuery.isLoading,
    error: leavesQuery.error,
    createLeaf: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useArchivedLeaves() {
  return useQuery({
    queryKey: ["archived-leaves"],
    queryFn: () => leafService.getArchivedLeaves(),
    staleTime: 30_000,
  });
}

export function useLeaf(leafId: string) {
  const queryClient = useQueryClient();

  const leafQuery = useQuery({
    queryKey: ["leaves", leafId],
    queryFn: () => leafService.getLeaf(leafId),
    enabled: !!leafId,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false, // Evita refetch ao focar janela durante edição
  });

  const summaryCache = queryClient.getQueryData<{ summary?: string }>([
    "leaves",
    leafId,
    "summary",
  ]);

  const leaf = useMemo(() => {
    if (!leafQuery.data) return undefined;

    const summary = summaryCache?.summary ?? leafQuery.data.summary;
    if (summary === leafQuery.data.summary) return leafQuery.data;

    return {
      ...leafQuery.data,
      summary,
    };
  }, [leafQuery.data, summaryCache?.summary]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLeafInput) => leafService.updateLeaf(leafId, data),
    onSuccess: (updatedLeaf) => {
      // ⚡ Atualiza o cache individual ['leaves', leafId] para que,
      // ao navegar de volta para a folha, o conteúdo salvo apareça.
      // Antes não atualizávamos por medo de recriar o editor, mas
      // o useEditorContent já protege com initialSyncDoneRef.current.
      queryClient.setQueryData<Leaf>(["leaves", leafId], (old: Leaf | undefined) => {
        if (!old) return updatedLeaf as unknown as Leaf;
        return {
          ...old,
          title: updatedLeaf.title ?? old.title,
          content: updatedLeaf.content ?? old.content,
          rawText: updatedLeaf.rawText ?? old.rawText,
          updatedAt: updatedLeaf.updatedAt ?? old.updatedAt,
        };
      });

      // Atualiza o título na lista de leaves para manter
      // o menu lateral sincronizado — sem disparar requisição HTTP.
      queryClient.setQueryData<Leaf[]>(
        ["notebooks", updatedLeaf.notebookId, "leaves"],
        (old: Leaf[] | undefined) =>
          old?.map((leaf: Leaf) => {
            if (leaf.id !== leafId) return leaf;
            if (leaf.title === updatedLeaf.title) return leaf;
            return {
              ...leaf,
              title: updatedLeaf.title,
              updatedAt: updatedLeaf.updatedAt ?? leaf.updatedAt,
            };
          }) ?? old,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leafService.deleteLeaf(leafId),
    onSuccess: () => {
      if (leafQuery.data) {
        const leafData = leafQuery.data;
        const notebookId = leafData.notebookId;
        const parentId = leafData.parentId;

        // ⚡ Remove a folha do cache + decrementa contagem — sem refetch
        queryClient.setQueryData<Leaf[]>(
          ["notebooks", notebookId, "leaves"],
          (old: Leaf[] | undefined) => old?.filter((l: Leaf) => l.id !== leafId) ?? old,
        );
        queryClient.setQueryData(
          ["notebooks", notebookId],
          (old: { leavesCount: number } | undefined) => {
            if (!old) return old;
            return { ...old, leavesCount: Math.max(0, old.leavesCount - 1) };
          },
        );

        // ⚡ Remove do array children da folha pai
        if (parentId) {
          queryClient.setQueryData<Leaf>(["leaves", parentId], (old: Leaf | undefined) => {
            if (!old) return old;
            return {
              ...old,
              children: (old.children ?? []).filter((c: { id: string }) => c.id !== leafId),
            };
          });
        }

        queryClient.removeQueries({ queryKey: ["leaves", leafId] });
        queryClient.removeQueries({ queryKey: ["leaves", leafId, "summary"] });
      }
    },
  });

  const summaryMutation = useMutation({
    mutationFn: () => leafService.generateAISummary(leafId),
    onSuccess: (data) => {
      queryClient.setQueryData<{ summary?: string }>(
        ["leaves", leafId, "summary"],
        (old: { summary?: string } | undefined) => {
          if (old?.summary === data.summary) return old;
          return { ...(old ?? {}), summary: data.summary };
        },
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => leafService.archiveLeaf(leafId),
    onSuccess: () => {
      if (leafQuery.data) {
        queryClient.removeQueries({ queryKey: ["leaves", leafId] });
        queryClient.invalidateQueries({ queryKey: ["archived-leaves"] });
      }
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => leafService.unarchiveLeaf(leafId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-leaves"] });
    },
  });

  const flashcardsMutation = useMutation({
    mutationFn: () => leafService.generateAIFlashcards(leafId),
    onSuccess: (flashcards) => {
      // ⚡ Define os flashcards diretamente no cache — sem refetch
      queryClient.setQueryData<Flashcard[]>(
        ["leaves", leafId, "flashcards"],
        (old: Flashcard[] | undefined) => {
          if (!old) return flashcards;
          const isSame =
            old.length === flashcards.length &&
            old.every((card: Flashcard, index: number) => {
              const nextCard = flashcards[index];
              return (
                card.id === nextCard?.id &&
                card.front === nextCard?.front &&
                card.back === nextCard?.back
              );
            });
          return isSame ? old : flashcards;
        },
      );

      // ✅ Recupera o notebookId do leaf para invalidar caches relacionados
      const notebookId = leafQuery.data?.notebookId;
      if (notebookId) {
        // Invalida a lista de flashcards do caderno (NotebookView)
        queryClient.invalidateQueries({
          queryKey: ["notebook-flashcards", notebookId],
        });
        // Invalida as estatísticas do Dashboard
        queryClient.invalidateQueries({ queryKey: ["study-stats"] });
      }
    },
  });

  return {
    leaf,
    isLoading: leafQuery.isLoading,
    isFetching: leafQuery.isFetching,
    error: leafQuery.error,
    updateLeaf: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteLeaf: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    archiveLeaf: archiveMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,

    unarchiveLeaf: unarchiveMutation.mutateAsync,
    isUnarchiving: unarchiveMutation.isPending,

    generateAISummary: summaryMutation.mutateAsync,
    isGeneratingSummary: summaryMutation.isPending,

    generateAIFlashcards: flashcardsMutation.mutateAsync,
    isGeneratingFlashcards: flashcardsMutation.isPending,
  };
}

