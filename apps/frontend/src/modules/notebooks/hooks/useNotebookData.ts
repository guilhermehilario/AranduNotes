import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotebook } from "./useNotebooks";
import { useLeaves } from "../../leaves/hooks/useLeaves";
import { useNotebookFlashcards } from "../../study/hooks/useFlashcards";
import { useToggleBookmark } from "../../bookmarks/hooks/useToggleBookmark";
import { useSoftDeleteNotebook } from "../../trash/hooks/useTrash";
import { useEditorStatusStore } from "../../../store/editorStatusStore";

interface UseNotebookDataParams {
  notebookId: string;
}

export function useNotebookData({ notebookId }: UseNotebookDataParams) {
  const navigate = useNavigate();
  // Seletores individuais da store (ações estáveis) — evita re-render a cada
  // setState e permite colocar as ações nas deps sem loop infinito.
  const showEditorStatus = useEditorStatusStore((s) => s.show);
  const setEditorStatusLastUpdate = useEditorStatusStore((s) => s.setLastUpdate);
  const hideEditorStatus = useEditorStatusStore((s) => s.hide);

  const {
    notebook,
    isLoading: isLoadingNotebook,
    updateNotebook,
  } = useNotebook(notebookId);

  const {
    leaves,
    isLoading: isLoadingLeaves,
    createLeaf,
  } = useLeaves(notebookId);

  const { data: flashcards = [], isLoading: isLoadingFlashcards } =
    useNotebookFlashcards(notebookId);

  const { isBookmarked, toggleBookmark } = useToggleBookmark({
    type: "notebook" as const,
    id: notebookId,
    title: notebook?.title || "",
    path: `/notebooks/${notebookId}`,
  });

  const softDeleteNotebook = useSoftDeleteNotebook();

  // Sincroniza editorStatus com o notebook carregado
  useEffect(() => {
    if (notebook) {
      showEditorStatus();
      setEditorStatusLastUpdate(
        typeof notebook.updatedAt === "string"
          ? notebook.updatedAt
          : notebook.updatedAt.toISOString(),
      );
    }
    return () => {
      hideEditorStatus();
    };
  }, [
    notebook?.id,
    notebook?.updatedAt,
    showEditorStatus,
    setEditorStatusLastUpdate,
    hideEditorStatus,
  ]);

  const isLoading = isLoadingNotebook || isLoadingLeaves;

  return {
    navigate,
    notebook,
    isLoadingNotebook,
    isLoadingLeaves,
    isLoading,
    updateNotebook,
    leaves,
    createLeaf,
    flashcards,
    isLoadingFlashcards,
    isBookmarked,
    toggleBookmark,
    softDeleteNotebook,
  };
}
