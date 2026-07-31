import React from "react";
import {
  BookmarkIcon,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { TagSelector } from "./TagSelector/TagSelector";

interface EditorHeaderProps {
  leafId: string;
  isBookmarked: boolean;
  isArchived: boolean;
  aiSidebarOpen: boolean;
  /** Ativa uma animação de atenção no botão de IA (dica de reabertura no mobile) */
  aiButtonHint?: boolean;
  onToggleBookmark: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
  onToggleAiSidebar: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  leafId,
  isBookmarked,
  isArchived,
  aiSidebarOpen,
  aiButtonHint = false,
  onToggleBookmark,
  onArchiveToggle,
  onDelete,
  onToggleAiSidebar,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-150 dark:border-dark-800 pb-3 flex-shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Tag Selector */}
        <TagSelector leafId={leafId} />

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer ${
            isBookmarked
              ? "text-amber-500"
              : "text-slate-500 dark:text-dark-300 hover:text-amber-500"
          }`}
          title={isBookmarked ? "Remover marcador" : "Adicionar marcador"}
        >
          <BookmarkIcon
            className={`h-3.5 w-3.5 ${isBookmarked ? "fill-amber-500" : ""}`}
          />
          <span className="hidden sm:inline">
            {isBookmarked ? "Marcado" : "Marcar"}
          </span>
        </button>

        {/* Archive Button */}
        <button
          type="button"
          onClick={onArchiveToggle}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer ${
            isArchived
              ? "text-emerald-500"
              : "text-slate-500 dark:text-dark-300 hover:text-emerald-500"
          }`}
          title={isArchived ? "Desarquivar" : "Arquivar"}
        >
          {isArchived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">
            {isArchived ? "Arquivado" : "Arquivar"}
          </span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-dark-300 hover:text-rose-500 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
          title="Mover para lixeira"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Excluir</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        {/* Toggle AI Sidebar */}
        <button
          type="button"
          onClick={onToggleAiSidebar}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer ${
            aiButtonHint
              ? "text-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-2 ring-brand-500/60 animate-pulse"
              : "text-slate-500 dark:text-dark-300 hover:text-brand-500"
          }`}
          title={aiSidebarOpen ? "Ocultar painel IA" : "Mostrar painel IA"}
        >
          {aiSidebarOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
          PA
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;
