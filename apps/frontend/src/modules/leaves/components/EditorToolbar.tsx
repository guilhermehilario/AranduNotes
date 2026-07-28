import React, { useEffect, useReducer } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  TextQuote,
  SeparatorHorizontal,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
} from 'lucide-react';
import { HeadingSelector } from './HeadingSelector';
import { LinkPopover } from './LinkPopover';
import { HighlightPopover } from './HighlightPopover';
import { AnnotationPopover } from './AnnotationPopover';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive,
  disabled,
  title,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex-shrink-0 p-2 rounded-lg transition-all duration-150 cursor-pointer select-none ${
      disabled
        ? 'text-slate-300 dark:text-dark-600 cursor-not-allowed'
        : isActive
          ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 shadow-sm ring-1 ring-brand-300/40 dark:ring-brand-600/40'
          : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800'
    }`}
  >
    {children}
  </button>
);

const Divider: React.FC = () => (
  <div className="w-px h-4 bg-slate-200 dark:bg-dark-700 self-center mx-1 flex-shrink-0" />
);

interface EditorToolbarProps {
  editor: Editor | null;
  annotationTrigger?: { text: string } | null;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
const mod = isMac ? '⌘' : 'Ctrl+';
const shift = isMac ? '⇧' : 'Shift+';

const kbd = (keys: string) => `${mod}${keys}`;
const kbdShift = (keys: string) => `${mod}${shift}${keys}`;

const EditorToolbarComponent: React.FC<EditorToolbarProps> = ({ editor, annotationTrigger }) => {
  const [, forceRender] = useReducer(x => x + 1, 0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => forceRender();
    editor.on('selectionUpdate', handler);
    editor.on('update', handler);
    return () => {
      editor.off('selectionUpdate', handler);
      editor.off('update', handler);
    };
  }, [editor]);

  if (!editor) return null;

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  return (
    <div className="pb-2 mb-3 border-b border-slate-100 dark:border-dark-800/80 flex-shrink-0">
      <div className="flex flex-wrap items-center gap-y-0.5">
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

        <Divider />

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

        <Divider />

        <HeadingSelector editor={editor} variant="toolbar" />

        <HighlightPopover editor={editor} variant="toolbar" />

        <LinkPopover editor={editor} />

        <Divider />

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

        <Divider />

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

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title={`Citação (${kbdShift('B')})`}
        >
          <TextQuote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title={`Linha horizontal (${kbdShift('-')})`}
        >
          <SeparatorHorizontal className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

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

        <Divider />

        <AnnotationPopover editor={editor} variant="toolbar" editTrigger={annotationTrigger} />
      </div>
    </div>
  );
};

export const EditorToolbar = React.memo(EditorToolbarComponent);
