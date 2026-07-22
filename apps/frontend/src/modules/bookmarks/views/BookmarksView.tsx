import React, { useState } from 'react';
import { useBookmarks, useDeleteBookmark } from '../hooks/useBookmarks';
import { BookmarkIcon, Trash2, Loader2, BookOpen, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';

export const BookmarksView: React.FC = () => {
  const { data: bookmarks = [], isLoading } = useBookmarks();
  const deleteBookmark = useDeleteBookmark();
  const navigate = useNavigate();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteBookmark.mutateAsync(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao remover marcador.'), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <PageContainer>
      <p className="text-slate-500 dark:text-dark-350">
        Acesse rapidamente suas páginas favoritas
      </p>

      {bookmarks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[30vh] border border-dashed border-slate-200 dark:border-dark-800">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500 mb-4">
            <BookmarkIcon className="h-7 w-7" />
          </div>
          <h3 className="text-md font-heading font-bold text-slate-850 dark:text-dark-100">
            Nenhuma página marcada
          </h3>
          <p className="text-sm text-slate-500 dark:text-dark-350 mt-1 max-w-sm">
            Marque páginas com o ícone de bookmark para acessá-las rapidamente aqui.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              hoverable
              onClick={() => navigate(bookmark.path)}
              className="flex items-center gap-4 p-4 border border-slate-100 dark:border-dark-800"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                {bookmark.leafId ? <FileText className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-heading font-bold truncate text-slate-800 dark:text-dark-50">
                  {bookmark.title}
                </h4>
                <p className="text-xs text-slate-400 dark:text-dark-400 mt-0.5 truncate">
                  {bookmark.leaf?.title || bookmark.notebook?.title || bookmark.path}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(bookmark.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmar exclusão */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remover marcador?"
        message="Tem certeza que deseja remover este marcador?"
        confirmLabel="Remover"
        variant="danger"
      />
    </PageContainer>
  );
};

export default BookmarksView;
