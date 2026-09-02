import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, X, Share2 } from 'lucide-react';
import { notebookService } from '../../notebooks/services/notebookService';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';

export interface ContentRef {
  resourceType: string;
  resourceId: string;
  title: string;
}

interface ShareContentModalProps {
  open: boolean;
  onClose: () => void;
  onShare: (ref: ContentRef) => void;
}

export const ShareContentModal: React.FC<ShareContentModalProps> = ({
  open,
  onClose,
  onShare,
}) => {
  const { data: notebooks = [], isLoading, error } = useQuery({
    queryKey: ['friends', 'share-notebooks'],
    queryFn: () => notebookService.getNotebooks(),
    enabled: open,
    staleTime: 30_000,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
            <h2 className="font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-brand-500" /> Compartilhar conteúdo
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-slate-500 dark:text-dark-400 mb-3">
              Escolha um caderno para enviar o link no chat.
            </p>
            {isLoading ? (
              <p className="text-sm text-slate-500 py-4">Carregando...</p>
            ) : error ? (
              <p className="text-sm text-rose-500 py-4">
                Não foi possível carregar seus conteúdos.
              </p>
            ) : notebooks.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                Você ainda não tem cadernos para compartilhar.
              </p>
            ) : (
              <ul className="space-y-2">
                {notebooks.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() =>
                        onShare({
                          resourceType: 'notebook',
                          resourceId: n.id,
                          title: n.title,
                        })
                      }
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--border-color)] hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-left cursor-pointer group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${n.color}22`,
                          color: n.color,
                        }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{n.title}</p>
                      </div>
                      <span className="text-xs text-brand-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Compartilhar
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-5 py-3 border-t border-[var(--border-color)] flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
