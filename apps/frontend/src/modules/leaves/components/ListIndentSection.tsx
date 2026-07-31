import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  List,
  ListOrdered,
  ListChecks,
  IndentIncrease,
  IndentDecrease,
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton.tsx';
import { EditorToolbarDivider } from './EditorToolbarDivider.tsx';
import { kbdShift } from '../hooks/useEditorToolbar.ts';

interface ListIndentSectionProps {
  editor: Editor;
  /** 'main' = listas essenciais; 'extra' = recuo (linha colapsável) */
  variant?: 'main' | 'extra';
}

export const ListIndentSection: React.FC<ListIndentSectionProps> = ({
  editor,
  variant = 'main',
}) => {
  if (variant === 'extra') {
    return (
      <>
        {/* Recuo */}
        <EditorToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().indent().run()}
          disabled={!editor.can().indent()}
          title={editor.can().indent() ? 'Aumentar recuo' : 'Recuo máximo atingido'}
        >
          <IndentIncrease className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().outdent().run()}
          disabled={!editor.can().outdent()}
          title={editor.can().outdent() ? 'Diminuir recuo' : 'Recuo mínimo atingido'}
        >
          <IndentDecrease className="h-4 w-4" />
        </ToolbarButton>
      </>
    );
  }

  return (
    <>
      {/* Listas */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title={`Lista com marcadores (${kbdShift('8')})`}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title={`Lista numerada (${kbdShift('9')})`}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Lista de tarefas"
      >
        <ListChecks className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};
