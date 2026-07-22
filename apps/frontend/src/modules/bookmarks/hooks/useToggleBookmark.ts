import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBookmarks, useCreateBookmark, useDeleteBookmark } from './useBookmarks';

interface UseToggleBookmarkOptions {
  /** 'leaf' para bookmark em folha, 'notebook' para bookmark em caderno */
  type: 'leaf' | 'notebook';
  /** ID da folha ou caderno */
  id: string;
  /** Título para exibir no bookmark */
  title: string;
  /** Caminho de navegação para o bookmark */
  path: string;
}

interface UseToggleBookmarkReturn {
  isBookmarked: boolean;
  toggleBookmark: () => Promise<void>;
}

/**
 * Hook compartilhado para toggle de bookmark (folha ou caderno).
 *
 * Elimina a duplicação de lógica entre EditorView e NotebookView.
 *
 * @example
 * // Em EditorView (leaf)
 * const { isBookmarked, toggleBookmark } = useToggleBookmark({
 *   type: 'leaf',
 *   id: leafId,
 *   title: leaf.title,
 *   path: `/notebooks/${notebookId}/leaves/${leafId}`,
 * });
 *
 * // Em NotebookView (notebook)
 * const { isBookmarked, toggleBookmark } = useToggleBookmark({
 *   type: 'notebook',
 *   id: notebookId,
 *   title: notebook.title,
 *   path: `/notebooks/${notebookId}`,
 * });
 */
export function useToggleBookmark({
  type,
  id,
  title,
  path,
}: UseToggleBookmarkOptions): UseToggleBookmarkReturn {
  const { data: allBookmarks = [] } = useBookmarks();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const queryClient = useQueryClient();

  const isBookmarked = allBookmarks.some((b) =>
    type === 'leaf' ? b.leafId === id : b.notebookId === id,
  );

  const toggleBookmark = useCallback(async () => {
    if (!id || !title) return;

    if (isBookmarked) {
      const existing = allBookmarks.find((b) =>
        type === 'leaf' ? b.leafId === id : b.notebookId === id,
      );
      if (existing) {
        await deleteBookmark.mutateAsync(existing.id);
      }
    } else {
      const bookmarkData: {
        leafId?: string;
        notebookId?: string;
        title: string;
        path: string;
      } = {
        title,
        path,
      };

      if (type === 'leaf') {
        bookmarkData.leafId = id;
      } else {
        bookmarkData.notebookId = id;
      }

      await createBookmark.mutateAsync(bookmarkData);
    }

    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  }, [type, id, title, path, isBookmarked, allBookmarks, createBookmark, deleteBookmark, queryClient]);

  return { isBookmarked, toggleBookmark };
}
