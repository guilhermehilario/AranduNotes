import React from 'react';
import {
  BookmarkIcon,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Archive,
  ArchiveRestore,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { TagSelector } from './TagSelector/TagSelector';

interface EditorHeaderProps {
  leafId: string;
  isBookmarked: boolean;
  isArchived: boolean;
  aiSidebarOpen: boolean;
  editorExpanded: boolean;
  onToggleBookmark: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
  onToggleAiSidebar: () => void;
  onToggleExpand: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  leafId,
  isBookmarked,
  isArchived,
  aiSidebarOpen,
  editorExpanded,
  onToggleBookmark,
  onArchiveToggle,
  onDelete,
  onToggleAiSidebar,
  onToggleExpand,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-150 dark:border-dark-800 pb-3 flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Tag Selector */}
        <TagSelector leafId={leafId} />

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer ${
            isBookmarked
              ? 'text-amber-500'
              : 'text-slate-500 dark:text-dark-300 hover:text-amber-500'
          }`}
          title={isBookmarked ? 'Remover marcador' : 'Adicionar marcador'}
        >
          <BookmarkIcon
            className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`}
          />
          {isBookmarked ? 'Marcado' : 'Marcar'}
        </button>

        {/* Archive Button */}
        <button
          type="button"
          onClick={onArchiveToggle}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer ${
            isArchived
              ? 'text-emerald-500'
              : 'text-slate-500 dark:text-dark-300 hover:text-emerald-500'
          }`}
          title={isArchived ? 'Desarquivar' : 'Arquivar'}
        >
          {isArchived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          {isArchived ? 'Arquivado' : 'Arquivar'}
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-dark-300 hover:text-rose-500 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
          title="Mover para lixeira"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Toggle AI Sidebar */}
        <button
          type="button"
          onClick={onToggleAiSidebar}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
          title={aiSidebarOpen ? 'Ocultar painel IA' : 'Mostrar painel IA'}
        >
          {aiSidebarOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
          IA
        </button>

        {/* Expand Editor */}
        <button
          type="button"
          onClick={onToggleExpand}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer ${
            editorExpanded
              ? 'text-brand-500 bg-brand-50 dark:bg-brand-950/20'
              : 'text-slate-500 dark:text-dark-300 hover:text-brand-500'
          }`}
          title={editorExpanded ? 'Recolher editor' : 'Expandir editor'}
        >
          {editorExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
          {editorExpanded ? 'Recolher' : 'Expandir'}
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;
