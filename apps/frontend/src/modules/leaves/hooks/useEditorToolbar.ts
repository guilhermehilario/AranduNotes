import { useCallback, useEffect, useReducer, useState, useRef } from 'react';
import type { Editor } from '@tiptap/react';

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
const mod = isMac ? '⌘' : 'Ctrl+';
const shift = isMac ? '⇧' : 'Shift+';

export const kbd = (keys: string) => `${mod}${keys}`;
export const kbdShift = (keys: string) => `${mod}${shift}${keys}`;

interface UseEditorToolbarReturn {
  canUndo: boolean;
  canRedo: boolean;
  formatPainterActive: boolean;
  handleFormatPainter: () => void;
  handleWrapQuotes: () => void;
}

export function useEditorToolbar(editor: Editor | null): UseEditorToolbarReturn {
  const [, forceRender] = useReducer(x => x + 1, 0);
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const formatPainterMarksRef = useRef<Record<string, Record<string, unknown>>>({});

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

  const handleFormatPainter = useCallback(() => {
    if (!editor) return;

    if (formatPainterActive) {
      const marks = formatPainterMarksRef.current;
      const { from, to } = editor.state.selection;
      const isCollapsed = from === to;

      if (!isCollapsed) {
        const chain = editor.chain().focus().unsetAllMarks();
        Object.entries(marks).forEach(([markType, attrs]) => {
          if (Object.keys(attrs).length > 0) {
            chain.setMark(markType, attrs);
          } else {
            chain.setMark(markType);
          }
        });
        chain.run();
      }

      setFormatPainterActive(false);
      formatPainterMarksRef.current = {};
    } else {
      const marks: Record<string, Record<string, unknown>> = {};
      const markNames = ['bold', 'italic', 'underline', 'strike', 'code', 'highlight', 'link'];
      markNames.forEach(name => {
        if (editor.isActive(name)) {
          const attrs = editor.getAttributes(name);
          marks[name] = attrs as Record<string, unknown>;
        }
      });

      if (editor.isActive('heading')) {
        const attrs = editor.getAttributes('heading');
        marks['heading'] = attrs as Record<string, unknown>;
      }

      formatPainterMarksRef.current = marks;

      if (Object.keys(marks).length > 0) {
        setFormatPainterActive(true);
      }
    }
  }, [editor, formatPainterActive]);

  // Cancel format painter on Escape
  useEffect(() => {
    if (!formatPainterActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFormatPainterActive(false);
        formatPainterMarksRef.current = {};
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [formatPainterActive]);

  const handleWrapQuotes = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;

    editor
      .chain()
      .focus()
      .insertContentAt(to, '"')
      .insertContentAt(from, '"')
      .setTextSelection({ from: from + 1, to: to + 1 })
      .run();
  }, [editor]);

  if (!editor) {
    return {
      canUndo: false,
      canRedo: false,
      formatPainterActive: false,
      handleFormatPainter: () => {},
      handleWrapQuotes: () => {},
    };
  }

  return {
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    formatPainterActive,
    handleFormatPainter,
    handleWrapQuotes,
  };
}
