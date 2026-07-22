import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";

interface UseEditorActionsParams {
  leafId: string;
  notebookId: string | undefined;
  navigate: (path: string) => void;
  queryClient: {
    invalidateQueries: (filters: { queryKey: string[] }) => void;
  };
  isArchived: boolean;
  archiveLeaf: () => Promise<unknown>;
  unarchiveLeaf: () => Promise<unknown>;
  softDeleteLeaf: { mutateAsync: (id: string) => Promise<unknown> };
  generateAISummary: () => Promise<unknown>;
  generateAIFlashcards: () => Promise<unknown>;
  editor: Editor | null;
}

interface UseEditorActionsReturn {
  aiSidebarOpen: boolean;
  setAiSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editorExpanded: boolean;
  handleExpandToggle: () => void;
  handleArchiveToggle: () => Promise<void>;
  confirmDeleteOpen: boolean;
  setConfirmDeleteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteConfirm: () => Promise<void>;
  isFlashcardModalOpen: boolean;
  setIsFlashcardModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleGenerateSummary: () => Promise<void>;
  handleGenerateFlashcards: () => Promise<void>;
  annotationTrigger: { text: string } | null;
  setAnnotationText: (text: string | null) => void;
}

export function useEditorActions({
  leafId,
  notebookId,
  navigate,
  queryClient,
  isArchived,
  archiveLeaf,
  unarchiveLeaf,
  softDeleteLeaf,
  generateAISummary,
  generateAIFlashcards,
  editor,
}: UseEditorActionsParams): UseEditorActionsReturn {
  // ── UI State: Sidebar e Expansão ──
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [editorExpanded, setEditorExpanded] = useState(false);

  const handleExpandToggle = useCallback(() => {
    setEditorExpanded((prev) => {
      const expanding = !prev;
      if (expanding) {
        setAiSidebarOpen(false);
      }
      return expanding;
    });
  }, []);

  // ── Archive / Unarchive ──
  const handleArchiveToggle = useCallback(async () => {
    if (!leafId) return;
    try {
      if (isArchived) {
        await unarchiveLeaf();
      } else {
        await archiveLeaf();
      }
      queryClient.invalidateQueries({ queryKey: ["leaves", leafId] });
    } catch (err) {
      const message = extractApiError(err, "Erro ao arquivar/desarquivar folha.");
      useToastStore.getState().addToast(message, "error");
    }
  }, [leafId, isArchived, archiveLeaf, unarchiveLeaf, queryClient]);

  // ── Delete (soft) ──
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    if (!leafId) return;
    try {
      await softDeleteLeaf.mutateAsync(leafId);
      setConfirmDeleteOpen(false);
      navigate(`/notebooks/${notebookId}`);
    } catch (err) {
      const message = extractApiError(err, "Erro ao excluir folha.");
      useToastStore.getState().addToast(message, "error");
    }
  }, [leafId, softDeleteLeaf, navigate, notebookId]);

  // ── Flashcard manual ──
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

  // ── IA Generation ──
  const handleGenerateSummary = useCallback(async () => {
    if (!leafId) return;
    try {
      await generateAISummary();
    } catch (err) {
      const message = extractApiError(err, "Erro ao gerar resumo.");
      useToastStore.getState().addToast(message, "error");
    }
  }, [leafId, generateAISummary]);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!leafId) return;
    try {
      await generateAIFlashcards();
    } catch (err) {
      const message = extractApiError(err, "Erro ao gerar flashcards.");
      useToastStore.getState().addToast(message, "error");
    }
  }, [leafId, generateAIFlashcards]);

  // ── Annotations ──
  const [annotationText, setAnnotationText] = useState<string | null>(null);
  const pendingRAF = useRef<number | null>(null);

  const annotationTrigger = useMemo(
    () => (annotationText ? { text: annotationText } : null),
    [annotationText],
  );

  // Registra o click handler para anotações no DOM do editor
  useEffect(() => {
    if (!editor) return;
    const editorDom = editor.view?.dom as HTMLElement | undefined;
    if (!editorDom) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const spanEl = target?.closest?.(
        "span.annotation-anchor[data-annotation]",
      );
      if (!spanEl) return;
      const text = spanEl.getAttribute("data-annotation") || "";
      if (!text) return;

      if (pendingRAF.current !== null) cancelAnimationFrame(pendingRAF.current);
      pendingRAF.current = requestAnimationFrame(() => {
        pendingRAF.current = null;
        if (!editor.isDestroyed) {
          editor.chain().focus().extendMarkRange("annotation").run();
          setAnnotationText(text);
        }
      });
    };

    editorDom.addEventListener("click", handleClick);
    return () => {
      editorDom.removeEventListener("click", handleClick);
      if (pendingRAF.current !== null) {
        cancelAnimationFrame(pendingRAF.current);
        pendingRAF.current = null;
      }
    };
  }, [editor]);

  return {
    aiSidebarOpen,
    setAiSidebarOpen,
    editorExpanded,
    handleExpandToggle,
    handleArchiveToggle,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    handleDeleteConfirm,
    isFlashcardModalOpen,
    setIsFlashcardModalOpen,
    handleGenerateSummary,
    handleGenerateFlashcards,
    annotationTrigger,
    setAnnotationText,
  };
}
