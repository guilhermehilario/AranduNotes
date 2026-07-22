import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  TextQuote,
  List,
  ListOrdered,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { HeadingSelector } from './HeadingSelector';
import { HighlightPopover } from './HighlightPopover';
import { AnnotationPopover } from './AnnotationPopover';

interface BubbleMenuItemProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

const BubbleMenuItem: React.FC<BubbleMenuItemProps> = ({
  onClick,
  isActive,
  title,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-white/20 text-white'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
const mod = isMac ? '⌘' : 'Ctrl+';
const shift = isMac ? '⇧' : 'Shift+';

const kbd = (keys: string) => `${mod}${keys}`;
const kbdShift = (keys: string) => `${mod}${shift}${keys}`;

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

const EditorBubbleMenuComponent: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  const [showExtra, setShowExtra] = React.useState(false);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
      }}
      className="bg-slate-800 dark:bg-dark-800 border border-slate-700 dark:border-dark-700 rounded-xl shadow-xl px-2 py-1.5 overflow-hidden"
    >
      {/* ── Linha 1: Essenciais ── */}
      <div className="flex items-center gap-0.5">
        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={`Negrito (${kbd('B')})`}
        >
          <Bold className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={`Itálico (${kbd('I')})`}
        >
          <Italic className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title={`Sublinhado (${kbdShift('U')})`}
        >
          <Underline className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title={`Tachado (${kbdShift('S')})`}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title={`Código (${kbd('E')})`}
        >
          <Code className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <div className="w-px h-4 bg-slate-600 dark:bg-dark-600 mx-1" />

        <HeadingSelector editor={editor} variant="bubble" />

        <div className="w-px h-4 bg-slate-600 dark:bg-dark-600 mx-1" />

        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title={`Citação (${kbdShift('B')})`}
        >
          <TextQuote className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <div className="w-px h-4 bg-slate-600 dark:bg-dark-600 mx-1" />

        <BubbleMenuItem
          onClick={() => {
            const { href } = editor.getAttributes('link');
            if (href) {
              editor.chain().focus().unsetLink().run();
            } else {
              const url = window.prompt('URL do link:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }
          }}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <HighlightPopover editor={editor} variant="bubble" />

        <AnnotationPopover editor={editor} variant="bubble" />

        <div className="w-px h-4 bg-slate-600 dark:bg-dark-600 mx-1" />

        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title={`Lista com marcadores (${kbdShift('8')})`}
        >
          <List className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        <BubbleMenuItem
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title={`Lista numerada (${kbdShift('9')})`}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </BubbleMenuItem>

        {/* Botão toggle para linha extra */}
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          title={showExtra ? 'Recolher ferramentas' : 'Mais ferramentas'}
          className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer ${
            showExtra
              ? 'bg-white/20 text-white'
              : 'text-white/50 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          {showExtra ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* ── Linha 2: Extras (colapsável) ── */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{
          gridTemplateRows: showExtra ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="flex items-center gap-0.5 pt-1.5 mt-1.5 border-t border-slate-700/60 dark:border-dark-700/60">
            <BubbleMenuItem
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Alinhar à esquerda"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </BubbleMenuItem>

            <BubbleMenuItem
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Centralizar"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </BubbleMenuItem>

            <BubbleMenuItem
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Alinhar à direita"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </BubbleMenuItem>

            <BubbleMenuItem
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
              title="Justificar"
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </BubbleMenuItem>

            <div className="w-px h-4 bg-slate-600 dark:bg-dark-600 mx-1" />

            <BubbleMenuItem
              onClick={() => editor.chain().focus().indent().run()}
              title="Aumentar recuo"
            >
              <IndentIncrease className="h-3.5 w-3.5" />
            </BubbleMenuItem>

            <BubbleMenuItem
              onClick={() => editor.chain().focus().outdent().run()}
              title="Diminuir recuo"
            >
              <IndentDecrease className="h-3.5 w-3.5" />
            </BubbleMenuItem>
          </div>
        </div>
      </div>
    </BubbleMenu>
  );
};

export const EditorBubbleMenu = React.memo(EditorBubbleMenuComponent);
