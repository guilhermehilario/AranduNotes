import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card.tsx';
import type { Notebook } from '../types';

interface NotebookCardProps {
  notebook: Notebook;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({ notebook }) => {
  const navigate = useNavigate();

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
        <p className="text-sm text-slate-500 dark:text-dark-350 line-clamp-3">
          {notebook.description || 'Nenhuma descrição adicionada.'}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 dark:border-dark-800/60 pt-4 text-xs font-semibold text-slate-400 dark:text-dark-400">
        <span>{notebook.leavesCount} folhas anotadas</span>
        <span className="flex items-center gap-1 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Acessar <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
};

export default NotebookCard;
