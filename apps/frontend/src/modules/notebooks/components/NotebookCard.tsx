import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Share2, Users } from 'lucide-react';
import { Card } from '../../../components/ui/Card.tsx';
import type { Notebook } from '../types';
import { formatDate, formatDateTime } from '../../../utils/dateFormatUtils.ts';

interface NotebookCardProps {
  notebook: Notebook;
  onShare?: () => void;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({ notebook, onShare }) => {
  const navigate = useNavigate();
  const isEditor = notebook.access === 'editor';

  return (
    <Card
      hoverable
      onClick={() => navigate(`/notebooks/${notebook.id}`)}
      className="flex flex-col justify-between group h-52 relative overflow-hidden border border-slate-100 dark:border-dark-800"
    >
      {/* Color Tag Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: notebook.color }}
      />

      {/* Share button (apenas owner) */}
      {!isEditor && onShare && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          aria-label="Compartilhar caderno"
          title="Compartilhar"
          className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-dark-800 transition-all cursor-pointer z-10"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: notebook.color }}
          />
          <h3 className="text-lg font-heading font-bold truncate text-slate-800 dark:text-dark-50 group-hover:text-brand-500 transition-colors">
            {notebook.title}
          </h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-dark-350 line-clamp-3 min-w-0">
          {notebook.description || 'Nenhuma descrição adicionada.'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-50 dark:border-dark-800/60 pt-4 text-xs font-semibold text-slate-400 dark:text-dark-400">
        <span className="flex items-center gap-1.5 min-w-0">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span
            className="truncate"
            title={formatDateTime(notebook.createdAt)}
          >
            Criado em {formatDate(notebook.createdAt)} ·{' '}
            {notebook.leavesCount} folhas
          </span>
        </span>
        <span className="flex items-center gap-1 text-brand-500 flex-shrink-0">
          {isEditor && <Users className="h-3.5 w-3.5" />}
          {isEditor ? (
            'Compartilhado'
          ) : (
            <>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Acessar
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </span>
      </div>
    </Card>
  );
};

export default NotebookCard;