import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  RemoveFormatting,
  TextQuote,
  Code2,
  SeparatorHorizontal,
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton.tsx';
import { EditorToolbarDivider } from './EditorToolbarDivider.tsx';
import { HeadingSelector } from './HeadingSelector';
import { kbd, kbdShift } from '../hooks/useEditorToolbar.ts';

interface HistoryFormatSectionProps {
  editor: Editor;
  canUndo: boolean;
  canRedo: boolean;
}

export const HistoryFormatSection: React.FC<HistoryFormatSectionProps> = ({
  editor,
  canUndo,
  canRedo,
}) => {
  return (
    <>
      {/* Histórico */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!canUndo}
        title={`Desfazer (${kbd('Z')})`}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!canRedo}
        title={`Refazer (${kbdShift('Z')})`}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <EditorToolbarDivider />

      {/* Formatação de Texto */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title={`Negrito (${kbd('B')})`}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title={`Itálico (${kbd('I')})`}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title={`Sublinhado (${kbdShift('U')})`}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title={`Tachado (${kbdShift('S')})`}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title={`Código (${kbd('E')})`}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Limpar formatação"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>

      <EditorToolbarDivider />

      {/* Estilos de Bloco */}
      <HeadingSelector editor={editor} variant="toolbar" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title={`Citação (${kbdShift('B')})`}
      >
        <TextQuote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Bloco de código"
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title={`Linha horizontal (${kbdShift('-')})`}
      >
        <SeparatorHorizontal className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};
