import React from 'react';
import type { Editor } from '@tiptap/react';
import { Paintbrush } from 'lucide-react';
import { ToolbarButton } from './ToolbarButton.tsx';
import { EditorToolbarDivider } from './EditorToolbarDivider.tsx';
import { AnnotationPopover } from './AnnotationPopover';

interface ToolSectionProps {
  editor: Editor;
  formatPainterActive: boolean;
  onFormatPainter: () => void;
  onWrapQuotes: () => void;
  annotationTrigger?: { text: string } | null;
  /** 'main' = essenciais (format painter/anotação); 'extra' = aspas (linha colapsável) */
  variant?: 'main' | 'extra';
}

export const ToolSection: React.FC<ToolSectionProps> = ({
  editor,
  formatPainterActive,
  onFormatPainter,
  onWrapQuotes,
  annotationTrigger,
  variant = 'main',
}) => {
  if (variant === 'extra') {
    return (
      <>
        <EditorToolbarDivider />

        <ToolbarButton
          onClick={onWrapQuotes}
          title="Envolver em aspas"
        >
          <span className="text-[10px] font-bold leading-none tracking-[1.5px]">“”</span>
        </ToolbarButton>
      </>
    );
  }

  return (
    <>
      <EditorToolbarDivider />

      {/* Ferramentas */}
      <ToolbarButton
        onClick={onFormatPainter}
        isActive={formatPainterActive}
        title={formatPainterActive ? 'Aplicar formatação (Esc p/ cancelar)' : 'Copiar formatação'}
      >
        <Paintbrush className={`h-4 w-4 transition-transform duration-200 ${formatPainterActive ? 'scale-110' : ''}`} />
      </ToolbarButton>

      <AnnotationPopover editor={editor} variant="toolbar" editTrigger={annotationTrigger} />
    </>
  );
};
