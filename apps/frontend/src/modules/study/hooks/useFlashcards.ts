import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import studyService from "../services/studyService";
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
