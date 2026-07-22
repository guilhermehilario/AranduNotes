import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useArchivedLeaves } from '../hooks/useLeaves';
import { Archive, FileText, Loader2, RotateCcw, BookOpen, Calendar } from 'lucide-react';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { useToastStore } from '../../../store/toastStore';
import { extractApiError } from '../../../utils/api-errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import leafService from '../services/leafService';

export const ArchivedLeavesView: React.FC = () => {
  const { data: archivedLeaves, isLoading } = useArchivedLeaves();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const unarchiveMutation = useMutation({
    mutationFn: (leafId: string) => leafService.unarchiveLeaf(leafId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-leaves'] });
    },
  });

  const handleUnarchive = async (leafId: string) => {
    try {
      await unarchiveMutation.mutateAsync(leafId);
    } catch (err) {
      useToastStore.getState().addToast(extractApiError(err, 'Erro ao desarquivar folha.'), 'error');
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
        Folhas arquivadas que foram ocultadas do caderno
      </p>

      {!archivedLeaves || archivedLeaves.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[30vh] border border-dashed border-slate-200 dark:border-dark-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-dark-800 flex items-center justify-center text-slate-400 mb-4">
            <Archive className="h-7 w-7" />
          </div>
          <h3 className="text-md font-heading font-bold text-slate-850 dark:text-dark-100">
            Nenhuma folha arquivada
          </h3>
          <p className="text-sm text-slate-500 dark:text-dark-350 mt-1 max-w-sm">
            Folhas arquivadas aparecerão aqui. Você pode desarquivá-las a qualquer momento.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {archivedLeaves.map((leaf) => (
            <Card
              key={leaf.id}
              className="flex items-center gap-4 p-4 border border-slate-100 dark:border-dark-800"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-500 flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold truncate text-slate-800 dark:text-dark-50">
                    {leaf.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 dark:text-dark-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Arquivado em {new Date(leaf.archivedAt || '').toLocaleDateString('pt-BR')}
                  {' · '}
                  <BookOpen className="h-3 w-3" />
                  {leaf.notebookId}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/notebooks/${leaf.notebookId}/leaves/${leaf.id}`);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors cursor-pointer"
                  title="Abrir folha"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUnarchive(leaf.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                  title="Desarquivar"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default ArchivedLeavesView;
