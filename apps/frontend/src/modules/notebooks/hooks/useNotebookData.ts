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
  const editorStatus = useEditorStatusStore();

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
      editorStatus.show();
      editorStatus.setLastUpdate(
        typeof notebook.updatedAt === "string"
          ? notebook.updatedAt
          : notebook.updatedAt.toISOString(),
      );
    }
    return () => {
      editorStatus.hide();
    };
  // NOTA: editorStatus NÃO entra nas deps — é um objeto store do Zustand
  // que muda de referência a cada setState, causando loop infinito.
  // As funções show/hide são estáveis e independem do estado da store.
  }, [notebook?.id, notebook?.updatedAt]);

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
