import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton.tsx';
import { EditorToolbarDivider } from './EditorToolbarDivider.tsx';
import { HighlightPopover } from './HighlightPopover';
import { LinkPopover } from './LinkPopover';

interface ColorAlignSectionProps {
  editor: Editor;
}

export const ColorAlignSection: React.FC<ColorAlignSectionProps> = ({ editor }) => {
  return (
    <>
      {/* Cor e Links */}
      <HighlightPopover editor={editor} variant="toolbar" />
      <LinkPopover editor={editor} />

      <EditorToolbarDivider />

      {/* Alinhamento */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justificar"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};
