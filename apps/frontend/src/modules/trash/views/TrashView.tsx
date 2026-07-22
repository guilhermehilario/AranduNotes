import React, { useState } from 'react';
import { useTrash, useRestoreNotebook, useRestoreLeaf, usePermanentDeleteNotebook, usePermanentDeleteLeaf, useCleanTrash } from '../hooks/useTrash';
import { Trash2, RotateCcw, Loader2, BookOpen, FileText, Clock, XCircle } from 'lucide-react';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import type { TrashItem } from '../services/trashService';

export const TrashView: React.FC = () => {
  const { data: trash, isLoading } = useTrash();
  const restoreNotebook = useRestoreNotebook();
  const restoreLeaf = useRestoreLeaf();
  const permanentDeleteNotebook = usePermanentDeleteNotebook();
  const permanentDeleteLeaf = usePermanentDeleteLeaf();
  const cleanTrash = useCleanTrash();

  const allItems = [
    ...(trash?.notebooks || []),
    ...(trash?.leaves || []),
  ].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  );

  const handleRestore = async (item: TrashItem) => {
    try {
      if (item.type === 'notebook') {
        await restoreNotebook.mutateAsync(item.id);
      } else {
        await restoreLeaf.mutateAsync(item.id);
      }
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao restaurar item.'), 'error');
    }
  };

  const [confirmDeleteItem, setConfirmDeleteItem] = useState<TrashItem | null>(null);
  const [confirmCleanOpen, setConfirmCleanOpen] = useState(false);

  const handlePermanentDeleteConfirm = async () => {
    if (!confirmDeleteItem) return;
    try {
      if (confirmDeleteItem.type === 'notebook') {
        await permanentDeleteNotebook.mutateAsync(confirmDeleteItem.id);
      } else {
        await permanentDeleteLeaf.mutateAsync(confirmDeleteItem.id);
      }
      setConfirmDeleteItem(null);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao excluir permanentemente.'), 'error');
    }
  };

  const handleCleanTrashConfirm = async () => {
    try {
      await cleanTrash.mutateAsync();
      setConfirmCleanOpen(false);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao limpar lixeira.'), 'error');
    }
  };

  const getDaysLeft = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = now.getTime() - deleted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return 15 - diffDays;
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
      <div className="flex justify-between items-center">
        <p className="text-slate-500 dark:text-dark-350">
          Itens excluídos são mantidos por 15 dias antes da exclusão permanente
        </p>
        {allItems.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setConfirmCleanOpen(true)}
            disabled={cleanTrash.isPending}
            className="text-rose-500 border-rose-200 hover:bg-rose-50"
          >
            {cleanTrash.isPending ? 'Limpando...' : 'Limpar Lixeira (+15 dias)'}
          </Button>
        )}
      </div>

      {allItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[30vh] border border-dashed border-slate-200 dark:border-dark-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-dark-800 flex items-center justify-center text-slate-400 mb-4">
            <Trash2 className="h-7 w-7" />
          </div>
          <h3 className="text-md font-heading font-bold text-slate-850 dark:text-dark-100">
            Lixeira vazia
          </h3>
          <p className="text-sm text-slate-500 dark:text-dark-350 mt-1 max-w-sm">
            Itens excluídos aparecerão aqui e serão permanentemente removidos após 15 dias.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {allItems.map((item) => {
            const daysLeft = getDaysLeft(item.deletedAt);
            return (
              <Card
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-4 p-4 border border-slate-100 dark:border-dark-800"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === 'notebook'
                    ? 'bg-slate-100 dark:bg-dark-800 text-slate-500'
                    : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                }`}>
                  {item.type === 'notebook' ? <BookOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold truncate text-slate-800 dark:text-dark-50">
                      {item.title}
                    </h4>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      daysLeft <= 0
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                        : daysLeft <= 3
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-dark-800 dark:text-dark-400'
                    }`}>
                      {daysLeft <= 0 ? 'A ser excluído' : `${daysLeft} dias restantes`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-dark-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Excluído em {new Date(item.deletedAt).toLocaleDateString('pt-BR')}
                    {item.type === 'leaf' && item.notebookTitle && (
                      <> · {item.notebookTitle}</>
                    )}
                    {item.flashcardsCount && item.flashcardsCount > 0 && (
                      <> · {item.flashcardsCount} flashcards</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                    title="Restaurar"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteItem(item)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Excluir permanentemente"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmar exclusão permanente */}
      <ConfirmDialog
        isOpen={confirmDeleteItem !== null}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handlePermanentDeleteConfirm}
        title="Excluir permanentemente?"
        message={confirmDeleteItem ? `Excluir permanentemente "${confirmDeleteItem.title}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir Permanentemente"
        variant="danger"
      />

      {/* Confirmar limpeza da lixeira */}
      <ConfirmDialog
        isOpen={confirmCleanOpen}
        onClose={() => setConfirmCleanOpen(false)}
        onConfirm={handleCleanTrashConfirm}
        title="Limpar lixeira?"
        message="Excluir permanentemente todos os itens com mais de 15 dias na lixeira?"
        confirmLabel="Limpar Lixeira"
        variant="danger"
      />
    </PageContainer>
  );
};

export default TrashView;
