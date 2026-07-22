import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateNotebookSchema } from "../types";
import type { CreateNotebookInput, Notebook } from "../types";
import studyService from "../../study/services/studyService";
import { NOTEBOOK_COLORS } from "../constants";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";
import type { UseMutateAsyncFunction } from "@tanstack/react-query";

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
  handleOpenEditModal: () => void;
  onEditSubmit: (data: CreateNotebookInput) => Promise<void>;
  handleDeleteNotebookConfirm: () => Promise<void>;
  onFlashcardSubmit: (data: { front: string; back: string }) => Promise<void>;
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

  const createFlashcardMutation = useMutation({
    mutationFn: (data: {
      leafId: string;
      notebookId: string;
      front: string;
      back: string;
    }) => studyService.createFlashcard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notebook-flashcards", notebookId],
      });
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
    handleOpenEditModal,
    onEditSubmit,
    handleDeleteNotebookConfirm,
    onFlashcardSubmit,
  };
}
