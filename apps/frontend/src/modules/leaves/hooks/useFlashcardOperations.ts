import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateFlashcard, useDeleteFlashcard } from "../../study/hooks/useFlashcards";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";
import leafService from "../services/leafService";
import type { Flashcard } from "../../study/types";
import type { Leaf } from "../types";

interface UseFlashcardOperationsParams {
  leafId: string;
  notebookId: string | undefined;
}

interface UseFlashcardOperationsReturn {
  /** Flashcard being edited */
  editingFlashcard: Flashcard | null;
  setEditingFlashcard: React.Dispatch<React.SetStateAction<Flashcard | null>>;
  /** Manual Summary Modal */
  isSummaryModalOpen: boolean;
  setIsSummaryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Edit Flashcard Modal */
  isEditFlashcardModalOpen: boolean;
  setIsEditFlashcardModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Flashcard delete confirmation */
  confirmDeleteFlashcardId: string | null;
  handleDeleteFlashcardClick: (cardId: string) => void;
  handleDeleteFlashcardConfirm: () => Promise<void>;
  handleCloseDeleteFlashcard: () => void;
  /** Summary deletion */
  confirmDeleteSummaryOpen: boolean;
  isDeletingSummary: boolean;
  handleDeleteSummaryClick: () => void;
  handleDeleteSummaryConfirm: () => Promise<void>;
  handleCloseDeleteSummary: () => void;
  /** Mutations */
  updateFlashcardMutation: ReturnType<typeof useUpdateFlashcard>;
  deleteFlashcardMutation: ReturnType<typeof useDeleteFlashcard>;
}

export function useFlashcardOperations({
  leafId,
  notebookId,
}: UseFlashcardOperationsParams): UseFlashcardOperationsReturn {
  const queryClient = useQueryClient();

  // ── Flashcard Edit ──
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isEditFlashcardModalOpen, setIsEditFlashcardModalOpen] = useState(false);

  const updateFlashcardMutation = useUpdateFlashcard(notebookId, leafId);
  const deleteFlashcardMutation = useDeleteFlashcard(notebookId, leafId);

  // ── Flashcard Delete with confirmation ──
  const [confirmDeleteFlashcardId, setConfirmDeleteFlashcardId] = useState<string | null>(null);

  const handleDeleteFlashcardClick = useCallback((cardId: string) => {
    setConfirmDeleteFlashcardId(cardId);
  }, []);

  const handleCloseDeleteFlashcard = useCallback(() => {
    setConfirmDeleteFlashcardId(null);
  }, []);

  const handleDeleteFlashcardConfirm = useCallback(async () => {
    if (!confirmDeleteFlashcardId) return;
    const id = confirmDeleteFlashcardId;
    setConfirmDeleteFlashcardId(null);
    await deleteFlashcardMutation.mutateAsync(id);
  }, [confirmDeleteFlashcardId, deleteFlashcardMutation]);

  // ── Summary Delete ──
  const [confirmDeleteSummaryOpen, setConfirmDeleteSummaryOpen] = useState(false);
  const [isDeletingSummary, setIsDeletingSummary] = useState(false);

  const handleCloseDeleteSummary = useCallback(() => {
    setConfirmDeleteSummaryOpen(false);
  }, []);

  const handleDeleteSummaryConfirm = useCallback(async () => {
    if (!leafId) return;
    setIsDeletingSummary(true);
    setConfirmDeleteSummaryOpen(false);
    try {
      const updated = await leafService.updateLeaf(leafId, { summary: null });
      queryClient.setQueryData<Leaf>(["leaves", leafId], (old) => {
        if (!old) return updated as unknown as Leaf;
        return { ...old, summary: null };
      });
      queryClient.setQueryData<{ summary?: string }>(
        ["leaves", leafId, "summary"],
        { summary: undefined },
      );
      useToastStore.getState().addToast("Resumo excluído com sucesso.", "success");
    } catch (err) {
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao excluir resumo."),
        "error",
      );
    } finally {
      setIsDeletingSummary(false);
    }
  }, [leafId, queryClient]);

  const handleDeleteSummaryClick = useCallback(() => {
    setConfirmDeleteSummaryOpen(true);
  }, []);

  return {
    editingFlashcard,
    setEditingFlashcard,
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    isEditFlashcardModalOpen,
    setIsEditFlashcardModalOpen,
    confirmDeleteFlashcardId,
    handleDeleteFlashcardClick,
    handleDeleteFlashcardConfirm,
    handleCloseDeleteFlashcard,
    confirmDeleteSummaryOpen,
    isDeletingSummary,
    handleDeleteSummaryClick,
    handleDeleteSummaryConfirm,
    handleCloseDeleteSummary,
    updateFlashcardMutation,
    deleteFlashcardMutation,
  };
}
