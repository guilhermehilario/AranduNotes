import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
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
  ChevronDown,
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

interface EditorToolbarProps {
  editor: Editor | null;
  annotationTrigger?: { text: string } | null;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
const mod = isMac ? '⌘' : 'Ctrl+';
const shift = isMac ? '⇧' : 'Shift+';

const kbd = (keys: string) => `${mod}${keys}`;
const kbdShift = (keys: string) => `${mod}${shift}${keys}`;

const ANIM_DURATION = 150;

// ── Hook: detecta overflow do toolbar ──
// Mede os itens SEMPRE de um elemento `measureRef` (hidden, com todos os itens)
// contra a largura disponível do `parentRef` (wrapper estável, sem feedback loop).
function useToolbarOverflow(
  parentRef: React.RefObject<HTMLDivElement | null>,
  measureRef: React.RefObject<HTMLDivElement | null>,
) {
  const [overflowIndex, setOverflowIndex] = useState<number | null>(null);

  const measure = useCallback(() => {
    const parent = parentRef.current;
    const measureEl = measureRef.current;
    if (!parent || !measureEl) return;

    const MORE_BUTTON_W = 44;
    const GAP = 4; // gap-1 = 4px
    const available = parent.clientWidth - MORE_BUTTON_W;

    // Acumula scrollWidth dos filhos do measureRef (sempre tem TODOS os itens)
    let acc = 0;
    const children = Array.from(measureEl.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      acc += children[i].scrollWidth + (i > 0 ? GAP : 0);
      if (acc > available) {
        setOverflowIndex(i);
        return;
      }
    }
    setOverflowIndex(null);
  }, [parentRef, measureRef]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [measure]);

  return overflowIndex;
}

const EditorToolbarComponent: React.FC<EditorToolbarProps> = ({ editor, annotationTrigger }) => {
  // ── Força re-render quando a seleção ou conteúdo do editor muda ──
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
  const canIndent = editor.can().indent();
  const canOutdent = editor.can().outdent();

  // ── Overflow responsivo ──
  const outerRef = useRef<HTMLDivElement>(null);  // wrapper estável (medido)
  const measureRef = useRef<HTMLDivElement>(null); // hidden c/ TODOS os itens
  const toolbarRef = useRef<HTMLDivElement>(null); // toolbar visível (sliced)
  const overflowIndex = useToolbarOverflow(outerRef, measureRef);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Animação de abertura/fechamento — mantém o componente montado durante exit
  const [showMenu, setShowMenu] = useState(false);
  const [animVisible, setAnimVisible] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const openMenu = useCallback(() => {
    clearTimeout(animTimerRef.current);
    setShowMenu(true);
    // Força o browser a registrar o mount antes de animar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimVisible(true));
    });
  }, []);

  const closeMenu = useCallback(() => {
    setAnimVisible(false);
    animTimerRef.current = setTimeout(() => {
      setShowMenu(false);
    }, ANIM_DURATION);
  }, []);

  const toggleMenu = useCallback(() => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
    setMenuOpen(!menuOpen);
  }, [menuOpen, openMenu, closeMenu]);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showMenu, closeMenu]);

  // Fecha o menu quando overflowIndex muda (redimensionamento alterou itens visíveis/ocultos)
  const prevOverflowRef = useRef(overflowIndex);
  useEffect(() => {
    if (prevOverflowRef.current !== overflowIndex && menuOpen) {
      setAnimVisible(false);
      clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => {
        setShowMenu(false);
        setMenuOpen(false);
      }, ANIM_DURATION);
    }
    prevOverflowRef.current = overflowIndex;
  }, [overflowIndex, menuOpen]);

  // Cleanup do timer
  useEffect(() => {
    return () => clearTimeout(animTimerRef.current);
  }, []);

  // ── Itens do toolbar (mantidos como JSX para reatividade) ──
  const items: React.ReactNode[] = [
    <ToolbarButton
      key="undo"
      onClick={() => editor.chain().focus().undo().run()}
      disabled={!canUndo}
      title={`Desfazer (${kbd('Z')})`}
    >
      <Undo2 className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="redo"
      onClick={() => editor.chain().focus().redo().run()}
      disabled={!canRedo}
      title={`Refazer (${kbdShift('Z')})`}
    >
      <Redo2 className="h-4 w-4" />
    </ToolbarButton>,

    <div key="sep-1" className="w-px h-5 bg-slate-200 dark:bg-dark-700 mx-1 flex-shrink-0" />,

    <ToolbarButton
      key="bold"
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor.isActive('bold')}
      title={`Negrito (${kbd('B')})`}
    >
      <Bold className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="italic"
      onClick={() => editor.chain().focus().toggleItalic().run()}
      isActive={editor.isActive('italic')}
      title={`Itálico (${kbd('I')})`}
    >
      <Italic className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="underline"
      onClick={() => editor.chain().focus().toggleUnderline().run()}
      isActive={editor.isActive('underline')}
      title={`Sublinhado (${kbdShift('U')})`}
    >
      <Underline className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="strike"
      onClick={() => editor.chain().focus().toggleStrike().run()}
      isActive={editor.isActive('strike')}
      title={`Tachado (${kbdShift('S')})`}
    >
      <Strikethrough className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="code"
      onClick={() => editor.chain().focus().toggleCode().run()}
      isActive={editor.isActive('code')}
      title={`Código (${kbd('E')})`}
    >
      <Code className="h-4 w-4" />
    </ToolbarButton>,

    <div key="sep-2" className="w-px h-5 bg-slate-200 dark:bg-dark-700 mx-1 flex-shrink-0" />,

    <HeadingSelector key="heading" editor={editor} variant="toolbar" />,

    <div key="sep-3" className="w-px h-5 bg-slate-200 dark:bg-dark-700 mx-1 flex-shrink-0" />,

    <ToolbarButton
      key="blockquote"
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      isActive={editor.isActive('blockquote')}
      title={`Citação (${kbdShift('B')})`}
    >
      <TextQuote className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="hr"
      onClick={() => editor.chain().focus().setHorizontalRule().run()}
      title={`Linha horizontal (${kbdShift('-')})`}
    >
      <SeparatorHorizontal className="h-4 w-4" />
    </ToolbarButton>,

    <div key="sep-4" className="w-px h-5 bg-slate-200 dark:bg-dark-700 mx-1 flex-shrink-0" />,

    <LinkPopover key="link" editor={editor} />,

    <HighlightPopover key="highlight" editor={editor} variant="toolbar" />,

    <AnnotationPopover key="annotation" editor={editor} variant="toolbar" editTrigger={annotationTrigger} />,

    <div key="sep-5" className="w-px h-5 bg-slate-200 dark:bg-dark-700 mx-1 flex-shrink-0" />,

    <ToolbarButton
      key="bulletList"
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor.isActive('bulletList')}
      title={`Lista com marcadores (${kbdShift('8')})`}
    >
      <List className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="orderedList"
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      isActive={editor.isActive('orderedList')}
      title={`Lista numerada (${kbdShift('9')})`}
    >
      <ListOrdered className="h-4 w-4" />
    </ToolbarButton>,

    <div key="sep-6" className="w-px h-5 bg-slate-200 dark:bg-dark-700 mx-1 flex-shrink-0" />,

    <ToolbarButton
      key="alignLeft"
      onClick={() => editor.chain().focus().setTextAlign('left').run()}
      isActive={editor.isActive({ textAlign: 'left' })}
      title="Alinhar à esquerda"
    >
      <AlignLeft className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="alignCenter"
      onClick={() => editor.chain().focus().setTextAlign('center').run()}
      isActive={editor.isActive({ textAlign: 'center' })}
      title="Centralizar"
    >
      <AlignCenter className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="alignRight"
      onClick={() => editor.chain().focus().setTextAlign('right').run()}
      isActive={editor.isActive({ textAlign: 'right' })}
      title="Alinhar à direita"
    >
      <AlignRight className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="alignJustify"
      onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      isActive={editor.isActive({ textAlign: 'justify' })}
      title="Justificar"
    >
      <AlignJustify className="h-4 w-4" />
    </ToolbarButton>,

    <div key="sep-7" className="w-px h-5 bg-slate-200 dark:bg-dark-700 mx-1 flex-shrink-0" />,

    <ToolbarButton
      key="indent"
      onClick={() => editor.chain().focus().indent().run()}
      disabled={!canIndent}
      title={canIndent ? 'Aumentar recuo' : 'Recuo máximo atingido'}
    >
      <IndentIncrease className="h-4 w-4" />
    </ToolbarButton>,

    <ToolbarButton
      key="outdent"
      onClick={() => editor.chain().focus().outdent().run()}
      disabled={!canOutdent}
      title={canOutdent ? 'Diminuir recuo' : 'Recuo mínimo atingido'}
    >
      <IndentDecrease className="h-4 w-4" />
    </ToolbarButton>,
  ];

  const hasOverflow = overflowIndex !== null && overflowIndex > 0;
  const visibleItems = hasOverflow ? items.slice(0, overflowIndex) : items;
  const hiddenItems = hasOverflow ? items.slice(overflowIndex) : [];

  return (
    <div
      ref={outerRef}
      className="relative pb-3 mb-4 border-b border-slate-100 dark:border-dark-800/80 flex-shrink-0"
    >
      {/* ── Hidden measurement toolbar (sempre com TODOS os itens) ── */}
      <div
        ref={measureRef}
        className="invisible absolute pointer-events-none flex items-center gap-1"
        aria-hidden="true"
      >
        {items}
      </div>

      {/* ── Toolbar visível + More button ── */}
      <div className="flex items-center gap-1">
        {/* Itens visíveis (overflow-hidden seguro pois já foram sliced) */}
        <div
          ref={toolbarRef}
          className="flex items-center gap-1 overflow-hidden"
        >
          {visibleItems}
        </div>

        {/* Botão "Mais" + Dropdown — FORA do overflow-hidden */}
        {hasOverflow && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={toggleMenu}
              title="Mais ferramentas"
              className={`p-2 rounded-lg transition-all duration-150 cursor-pointer select-none ${
                menuOpen
                  ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 shadow-sm ring-1 ring-brand-300/40 dark:ring-brand-600/40'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800'
              }`}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Overlay Horizontal com fade (sem backdrop-filter p/ não quebrar position:fixed) */}
            {showMenu && (
              <div
                className={`absolute right-0 top-full z-[9999] transition-all duration-[150ms] ease-out ${
                  animVisible
                    ? 'opacity-100 mt-2'
                    : 'opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-1 px-3 py-2 rounded-xl border shadow-xl bg-slate-900 dark:bg-dark-900 border-slate-700/50 dark:border-dark-700/50">
                  {hiddenItems.map((item, idx) => {
                    // Detect dividers by their key prefix (sep-1, sep-2, etc.)
                    const itemKey = React.isValidElement(item) && typeof item.key === 'string' ? item.key : '';
                    const isDivider = itemKey.startsWith('sep-');

                    if (isDivider) {
                      return (
                        <div key={itemKey || `divider-${idx}`} className="w-px h-5 bg-slate-600/50 dark:bg-dark-600/50 mx-1 flex-shrink-0" />
                      );
                    }

                    // Render the item directly in horizontal layout
                    return item as React.ReactElement;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const EditorToolbar = React.memo(EditorToolbarComponent);
