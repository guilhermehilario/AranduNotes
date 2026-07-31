import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useEditorToolbar } from '../hooks/useEditorToolbar.ts';
import { HistoryFormatSection } from './HistoryFormatSection.tsx';
import { ColorAlignSection } from './ColorAlignSection.tsx';
import { ListIndentSection } from './ListIndentSection.tsx';
import { ToolSection } from './ToolSection.tsx';
import { EditorToolbarDivider } from './EditorToolbarDivider.tsx';

interface EditorToolbarProps {
  editor: Editor | null;
  annotationTrigger?: { text: string } | null;
}

const EditorToolbarComponent: React.FC<EditorToolbarProps> = ({ editor, annotationTrigger }) => {
  const {
    canUndo,
    canRedo,
    formatPainterActive,
    handleFormatPainter,
    handleWrapQuotes,
  } = useEditorToolbar(editor);

  // ── Ferramentas extras colapsáveis (mesmo padrão do BubbleMenu) ──
  const [showExtra, setShowExtra] = useState(false);

  if (!editor) return null;

  return (
    <div className="pb-2 mb-3 border-b border-slate-100 dark:border-dark-800/80 flex-shrink-0">
      {/* As ferramentas extras aparecem ACIMA do botão toggle, inseridas no fluxo
          seguindo a sequência das ferramentas já visíveis — não em linha abaixo.
          O grid colapsa altura (grid-template-rows 0fr/1fr) E largura
          (max-width 0/100%) para não deixar espaço vazio quando recolhido. */}
      <div className="flex flex-wrap items-center gap-y-0.5">
        <HistoryFormatSection
          editor={editor}
          canUndo={canUndo}
          canRedo={canRedo}
          variant="main"
        />
        <ColorAlignSection editor={editor} variant="main" />
        <ListIndentSection editor={editor} variant="main" />
        <ToolSection
          editor={editor}
          formatPainterActive={formatPainterActive}
          onFormatPainter={handleFormatPainter}
          onWrapQuotes={handleWrapQuotes}
          annotationTrigger={annotationTrigger}
          variant="main"
        />

        {/* Ferramentas extras — deslizam para dentro do fluxo, antes do botão */}
        <div
          className="grid overflow-hidden transition-[grid-template-rows,max-width] duration-200 ease-out"
          style={{
            gridTemplateRows: showExtra ? '1fr' : '0fr',
            maxWidth: showExtra ? '100%' : '0',
          }}
        >
          <div className="overflow-hidden min-h-0">
            <div className="flex flex-wrap items-center gap-y-0.5">
              <EditorToolbarDivider />
              <HistoryFormatSection
                editor={editor}
                canUndo={canUndo}
                canRedo={canRedo}
                variant="extra"
              />
              <ColorAlignSection editor={editor} variant="extra" />
              <ListIndentSection editor={editor} variant="extra" />
              <ToolSection
                editor={editor}
                formatPainterActive={formatPainterActive}
                onFormatPainter={handleFormatPainter}
                onWrapQuotes={handleWrapQuotes}
                annotationTrigger={annotationTrigger}
                variant="extra"
              />
            </div>
          </div>
        </div>

        {/* Botão toggle — permanece no fim da sequência */}
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          title={showExtra ? 'Recolher ferramentas' : 'Mais ferramentas'}
          aria-expanded={showExtra}
          className={`flex-shrink-0 p-2 rounded-lg transition-all duration-150 cursor-pointer ${
            showExtra
              ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 shadow-sm ring-1 ring-brand-300/40 dark:ring-brand-600/40'
              : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800'
          }`}
        >
          {showExtra ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export const EditorToolbar = React.memo(EditorToolbarComponent);
