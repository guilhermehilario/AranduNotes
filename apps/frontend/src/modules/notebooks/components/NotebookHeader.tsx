import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Play, BookmarkIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button.tsx';
import type { Notebook } from '../types';

interface NotebookHeaderProps {
  notebook: Notebook;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onOpenEditModal: () => void;
  onDelete: () => void;
}

export const NotebookHeader: React.FC<NotebookHeaderProps> = ({
  notebook,
  isBookmarked,
  onToggleBookmark,
  onOpenEditModal,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-3xl bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 relative overflow-hidden">
      {/* Faixa lateral colorida */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3.5"
        style={{ backgroundColor: notebook.color }}
      />

      <div className="flex flex-col gap-2 pl-4">
        <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-dark-50 m-0">
          {notebook.title}
        </h1>
        <p className="text-slate-550 dark:text-dark-300 text-sm max-w-xl">
          {notebook.description || 'Nenhuma descrição adicionada.'}
        </p>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto flex-wrap justify-end">
        {/* Bookmark button */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isBookmarked
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-dark-800'
          }`}
          title={isBookmarked ? 'Remover marcador' : 'Adicionar marcador'}
        >
          <BookmarkIcon className={`h-5 w-5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
        </button>

        <Button
          variant="outline"
          onClick={onOpenEditModal}
          leftIcon={<Edit2 className="h-4.5 w-4.5" />}
        >
          Editar
        </Button>

        <Button
          variant="outline"
          onClick={onDelete}
          className="text-rose-500 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          leftIcon={<Trash2 className="h-4.5 w-4.5" />}
        >
          Excluir
        </Button>

        <Button
          onClick={() => navigate(`/notebooks/${notebook.id}/study`)}
          leftIcon={<Play className="h-4.5 w-4.5" />}
          className="bg-brand-500 shadow-md shadow-brand-500/10"
        >
          Estudar Flashcards
        </Button>
      </div>
    </div>
  );
};

export default NotebookHeader;
