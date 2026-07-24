import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import studyService from "../services/studyService";
import trashService from "../../trash/services/trashService";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";
import type { Flashcard, StudyScore } from "../types";

export function useLeafFlashcards(leafId: string) {
  return useQuery({
    queryKey: ["leaves", leafId, "flashcards"],
    queryFn: () => studyService.getLeafFlashcards(leafId),
    enabled: !!leafId,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export function useNotebookFlashcards(notebookId: string) {
  return useQuery({
    queryKey: ["notebook-flashcards", notebookId],
    queryFn: () => studyService.getNotebookFlashcards(notebookId),
    enabled: !!notebookId,
    staleTime: 1000 * 60 * 5, // 5 minutos – evita refetch agressivo durante a sessão
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateFlashcard(notebookId?: string, leafId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      data,
    }: {
      cardId: string;
      data: { front?: string; back?: string };
    }) => studyService.updateFlashcard(cardId, data),
    onSuccess: (updatedCard) => {
      // ⚡ Atualiza o cache imediatamente
      if (leafId) {
        queryClient.setQueryData<Flashcard[]>(
          ["leaves", leafId, "flashcards"],
          (old) =>
            old?.map((card) =>
              card.id === updatedCard.id ? updatedCard : card,
            ) ?? old,
        );
      }
      if (notebookId) {
        queryClient.setQueryData<Flashcard[]>(
          ["notebook-flashcards", notebookId],
          (old) =>
            old?.map((card) =>
              card.id === updatedCard.id ? updatedCard : card,
            ) ?? old,
        );
      }
      useToastStore
        .getState()
        .addToast("Flashcard atualizado com sucesso.", "success");
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao atualizar flashcard."),
        "error",
      );
    },
  });
}

export function useDeleteFlashcard(notebookId?: string, leafId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => trashService.softDeleteFlashcard(cardId),
    onSuccess: (_, cardId) => {
      // ⚡ Remove o flashcard do cache imediatamente
      if (notebookId) {
        queryClient.setQueryData<Flashcard[]>(
          ["notebook-flashcards", notebookId],
          (old) => old?.filter((fc) => fc.id !== cardId) ?? old,
        );
      }
      if (leafId) {
        queryClient.setQueryData<Flashcard[]>(
          ["leaves", leafId, "flashcards"],
          (old) => old?.filter((fc) => fc.id !== cardId) ?? old,
        );
      }
      // ✅ Invalida as estatísticas do Dashboard
      queryClient.invalidateQueries({ queryKey: ["study-stats"] });
      useToastStore
        .getState()
        .addToast("Flashcard movido para lixeira.", "success");
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao excluir flashcard."),
        "error",
      );
    },
  });
}

export function useSubmitCardScore(leafId?: string, notebookId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, score }: { cardId: string; score: StudyScore }) =>
      studyService.submitFlashcardScore(cardId, score),
    onSuccess: (updatedCard, { cardId }) => {
      // Atualização cirúrgica e silenciosa do cache:
      // substitui apenas o card modificado, sem invalidar a query inteira.
      if (leafId) {
        queryClient.setQueryData<Flashcard[]>(
          ["leaves", leafId, "flashcards"],
          (old) =>
            old?.map((card) => (card.id === cardId ? updatedCard : card)) ??
            old,
        );
      }
      if (notebookId) {
        queryClient.setQueryData<Flashcard[]>(
          ["notebook-flashcards", notebookId],
          (old) =>
            old?.map((card) => (card.id === cardId ? updatedCard : card)) ??
            old,
        );
      }

      // ✅ Invalida as estatísticas para refletir o progresso no Dashboard
      queryClient.invalidateQueries({ queryKey: ["study-stats"] });
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao salvar progresso do flashcard."),
        "error",
      );
    },
  });
}
