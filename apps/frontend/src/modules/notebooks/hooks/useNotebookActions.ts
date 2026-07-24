import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateNotebookSchema } from "../types";
import type { CreateNotebookInput, Notebook } from "../types";
import studyService from "../../study/services/studyService";
import trashService from "../../trash/services/trashService";
import { NOTEBOOK_COLORS } from "../constants";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";
import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import type { Flashcard } from "../../study/types";

interface UseNotebookActionsParams {
  notebookId: string;
  notebook: Notebook | undefined;
  navigate: (path: string) => void;
  updateNotebook: (data: {
    title: string;
    description?: string | null;
    color: string;
  }) => Promise<unknown>;
  softDeleteNotebook: { mutateAsync: (id: string) => Promise<unknown> };
}

interface UseNotebookActionsReturn {
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  isFlashcardModalOpen: boolean;
  setIsFlashcardModalOpen: (open: boolean) => void;
  selectedLeafId: string;
  setSelectedLeafId: (id: string) => void;
  actionError: string | null;
  confirmDeleteOpen: boolean;
  setConfirmDeleteOpen: (open: boolean) => void;
  registerEdit: ReturnType<typeof useForm<CreateNotebookInput>>["register"];
  handleSubmitEdit: ReturnType<typeof useForm<CreateNotebookInput>>["handleSubmit"];
  editErrors: ReturnType<typeof useForm<CreateNotebookInput>>["formState"]["errors"];
  registerFc: ReturnType<typeof useForm<{ front: string; back: string }>>["register"];
  handleSubmitFc: ReturnType<typeof useForm<{ front: string; back: string }>>["handleSubmit"];
  resetFc: () => void;
  fcErrors: ReturnType<typeof useForm<{ front: string; back: string }>>["formState"]["errors"];
  createFlashcardMutation: { isPending: boolean; mutateAsync: UseMutateAsyncFunction<unknown, Error, { leafId: string; notebookId: string; front: string; back: string }> };
  editFlashcardMutation: { isPending: boolean; mutateAsync: UseMutateAsyncFunction<unknown, Error, { cardId: string; data: { front?: string; back?: string } }> };
  deleteFlashcardMutation: { isPending: boolean; mutateAsync: UseMutateAsyncFunction<unknown, Error, string> };
  isEditFlashcardModalOpen: boolean;
  setIsEditFlashcardModalOpen: (open: boolean) => void;
  editingFlashcard: Flashcard | null;
  setEditingFlashcard: (card: Flashcard | null) => void;
  handleOpenEditModal: () => void;
  onEditSubmit: (data: CreateNotebookInput) => Promise<void>;
  handleDeleteNotebookConfirm: () => Promise<void>;
  onFlashcardSubmit: (data: { front: string; back: string }) => Promise<void>;
  onEditFlashcard: (card: Flashcard) => void;
  onDeleteFlashcard: (cardId: string) => Promise<void>;
  onEditFlashcardSave: (cardId: string, data: { front: string; back: string }) => Promise<void>;
}

export function useNotebookActions({
  notebookId,
  notebook,
  navigate,
  updateNotebook,
  softDeleteNotebook,
}: UseNotebookActionsParams): UseNotebookActionsReturn {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(NOTEBOOK_COLORS[0]);
  const [selectedLeafId, setSelectedLeafId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEditFlashcardModalOpen, setIsEditFlashcardModalOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);

  // ── Edit form ──
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<CreateNotebookInput>({
    resolver: zodResolver(CreateNotebookSchema),
  });

  // ── Flashcard form ──
  const {
    register: registerFc,
    handleSubmit: handleSubmitFc,
    reset: resetFc,
    formState: { errors: fcErrors },
  } = useForm<{ front: string; back: string }>();

  const editFlashcardMutation = useMutation({
    mutationFn: ({
      cardId,
      data,
    }: {
      cardId: string;
      data: { front?: string; back?: string };
    }) => studyService.updateFlashcard(cardId, data),
    onSuccess: (updatedCard) => {
      // ⚡ Atualiza o cache imediatamente
      queryClient.setQueryData<Flashcard[]>(
        ["notebook-flashcards", notebookId],
        (old) =>
          old?.map((card) =>
            card.id === updatedCard.id ? updatedCard : card,
          ) ?? old,
      );
      useToastStore
        .getState()
        .addToast("Flashcard atualizado com sucesso.", "success");
      setIsEditFlashcardModalOpen(false);
      setEditingFlashcard(null);
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao atualizar flashcard."),
        "error",
      );
    },
  });

  const deleteFlashcardMutation = useMutation({
    mutationFn: (cardId: string) => trashService.softDeleteFlashcard(cardId),
    onSuccess: (_, cardId) => {
      // ⚡ Remove o flashcard do cache imediatamente
      queryClient.setQueryData<Flashcard[]>(
        ["notebook-flashcards", notebookId],
        (old) => old?.filter((fc) => fc.id !== cardId) ?? old,
      );
      // ✅ Invalida as estatísticas do Dashboard
      queryClient.invalidateQueries({ queryKey: ["study-stats"] });
      useToastStore
        .getState()
        .addToast("Flashcard movido para lixeira.", "success");
      setIsEditFlashcardModalOpen(false);
      setEditingFlashcard(null);
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao excluir flashcard."),
        "error",
      );
    },
  });

  const createFlashcardMutation = useMutation({
    mutationFn: (data: {
      leafId: string;
      notebookId: string;
      front: string;
      back: string;
    }) => studyService.createFlashcard(data),
    onSuccess: (newFlashcard) => {
      // ✅ Adiciona o novo flashcard ao cache imediatamente — sem precisar recarregar
      queryClient.setQueryData<Flashcard[]>(
        ["notebook-flashcards", notebookId],
        (old) => [...(old || []), newFlashcard],
      );
      // ✅ Invalida as estatísticas para refletir novos cards no Dashboard
      queryClient.invalidateQueries({ queryKey: ["study-stats"] });
      setIsFlashcardModalOpen(false);
      resetFc();
      setSelectedLeafId("");
    },
  });

  // ── Handlers ──

  const handleOpenEditModal = useCallback(() => {
    if (!notebook) return;
    const currentColor = notebook.color || NOTEBOOK_COLORS[0];
    resetEdit({
      title: notebook.title,
      description: notebook.description || "",
      color: currentColor,
    });
    setSelectedColor(currentColor);
    setActionError(null);
    setIsEditModalOpen(true);
  }, [notebook, resetEdit]);

  const onEditSubmit = useCallback(
    async (data: CreateNotebookInput) => {
      try {
        setActionError(null);
        await updateNotebook({ ...data, color: selectedColor });
        setIsEditModalOpen(false);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro ao atualizar caderno";
      setActionError(msg);
      useToastStore
        .getState()
        .addToast(extractApiError(error, "Erro ao atualizar caderno."), "error");
    }
    },
    [updateNotebook, selectedColor],
  );

  const handleDeleteNotebookConfirm = useCallback(async () => {
    try {
      setActionError(null);
      await softDeleteNotebook.mutateAsync(notebookId);
      setConfirmDeleteOpen(false);
      navigate("/dashboard");
    } catch (error) {
      setConfirmDeleteOpen(false);
      const msg =
        error instanceof Error
          ? error.message
          : "Erro ao mover para lixeira";
      setActionError(msg);
      useToastStore
        .getState()
        .addToast(
          extractApiError(error, "Erro ao mover para lixeira."),
          "error",
        );
    }
  }, [notebookId, softDeleteNotebook, navigate]);

  const onFlashcardSubmit = useCallback(
    async (data: { front: string; back: string }) => {
      if (!notebookId || !selectedLeafId) return;
      try {
        await createFlashcardMutation.mutateAsync({
          leafId: selectedLeafId,
          notebookId,
          front: data.front,
          back: data.back,
        });
    } catch (error) {
      useToastStore
        .getState()
        .addToast(
          extractApiError(error, "Erro ao criar flashcard."),
          "error",
        );
    }
    },
    [notebookId, selectedLeafId, createFlashcardMutation],
  );

  const onEditFlashcard = useCallback((card: Flashcard) => {
    setEditingFlashcard(card);
    setIsEditFlashcardModalOpen(true);
  }, []);

  const onDeleteFlashcard = useCallback(
    async (cardId: string) => {
      try {
        await deleteFlashcardMutation.mutateAsync(cardId);
      } catch (error) {
        // Toast já exibido no onError da mutation
      }
    },
    [deleteFlashcardMutation],
  );

  const onEditFlashcardSave = useCallback(
    async (cardId: string, data: { front: string; back: string }) => {
      try {
        await editFlashcardMutation.mutateAsync({ cardId, data });
      } catch (error) {
        // Toast já exibido no onError da mutation
      }
    },
    [editFlashcardMutation],
  );

  return {
    isEditModalOpen,
    setIsEditModalOpen,
    selectedColor,
    setSelectedColor,
    isFlashcardModalOpen,
    setIsFlashcardModalOpen,
    selectedLeafId,
    setSelectedLeafId,
    actionError,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    registerEdit,
    handleSubmitEdit,
    editErrors,
    registerFc,
    handleSubmitFc,
    resetFc,
    fcErrors,
    createFlashcardMutation: {
      isPending: createFlashcardMutation.isPending,
      mutateAsync: createFlashcardMutation.mutateAsync,
    },
    editFlashcardMutation: {
      isPending: editFlashcardMutation.isPending,
      mutateAsync: editFlashcardMutation.mutateAsync,
    },
    deleteFlashcardMutation: {
      isPending: deleteFlashcardMutation.isPending,
      mutateAsync: deleteFlashcardMutation.mutateAsync,
    },
    isEditFlashcardModalOpen,
    setIsEditFlashcardModalOpen,
    editingFlashcard,
    setEditingFlashcard,
    handleOpenEditModal,
    onEditFlashcard,
    onDeleteFlashcard,
    onEditFlashcardSave,
    onEditSubmit,
    handleDeleteNotebookConfirm,
    onFlashcardSubmit,
  };
}
