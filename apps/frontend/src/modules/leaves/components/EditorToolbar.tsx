import React from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorToolbar } from '../hooks/useEditorToolbar.ts';
import { HistoryFormatSection } from './HistoryFormatSection.tsx';
import { ColorAlignSection } from './ColorAlignSection.tsx';
import { ListIndentSection } from './ListIndentSection.tsx';
import { ToolSection } from './ToolSection.tsx';

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

  if (!editor) return null;

  return (
    <div className="pb-2 mb-3 border-b border-slate-100 dark:border-dark-800/80 flex-shrink-0">
      <div className="flex flex-wrap items-center gap-y-0.5">
        <HistoryFormatSection
          editor={editor}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <ColorAlignSection editor={editor} />
        <ListIndentSection editor={editor} />
        <ToolSection
          editor={editor}
          formatPainterActive={formatPainterActive}
          onFormatPainter={handleFormatPainter}
          onWrapQuotes={handleWrapQuotes}
          annotationTrigger={annotationTrigger}
        />
      </div>
    </div>
  );
};

export const EditorToolbar = React.memo(EditorToolbarComponent);
