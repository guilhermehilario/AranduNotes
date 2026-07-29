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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 p-4 sm:p-6 rounded-3xl relative overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      {/* Faixa lateral colorida */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2.5 sm:w-3.5"
        style={{ backgroundColor: notebook.color }}
      />

      <div className="flex flex-col gap-2 pl-3 sm:pl-4 min-w-0">
        <h1 className="text-xl sm:text-3xl font-heading font-extrabold m-0 truncate" style={{ color: 'var(--text-primary)' }}>
          {notebook.title}
        </h1>
        <p className="text-xs sm:text-sm max-w-xl line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {notebook.description || 'Nenhuma descrição adicionada.'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 self-stretch md:self-auto flex-wrap justify-end w-full md:w-auto">
        {/* Bookmark button */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            !isBookmarked ? 'hover:text-amber-500 hover:bg-[var(--bg-surface-hover)]' : ''
          }`}
          style={{
            color: isBookmarked ? '#F59E0B' : 'var(--text-secondary)',
            background: isBookmarked ? 'var(--bg-surface-hover)' : 'transparent',
          }}
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
