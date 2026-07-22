import { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { MessageSquarePlus, MessageSquareText, X, Save } from 'lucide-react';
import { useDropdown } from '../hooks/useDropdown';

interface AnnotationPopoverProps {
  editor: Editor | null;
  variant?: 'toolbar' | 'bubble';
  /**
   * Dispara a abertura do popover com o texto pré-preenchido.
   * Mude a referência do objeto para reabrir com um novo texto.
   */
  editTrigger?: { text: string } | null;
}

export const AnnotationPopover: React.FC<AnnotationPopoverProps> = ({
  editor,
  variant = 'toolbar',
  editTrigger,
}) => {
  const { open, setOpen, close, containerRef, buttonRef, dropdownStyle, recalcPosition } = useDropdown();
  const [annotationText, setAnnotationText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTriggerRef = useRef<string | null>(null);

  // Focus textarea when opened
  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  // External trigger: abre o popover pré-preenchido ao clicar em anotação no editor
  useEffect(() => {
    if (!editTrigger || !editor) return;
    const text = editTrigger.text;
    if (text === lastTriggerRef.current) return;
    lastTriggerRef.current = text;

    setAnnotationText(text);
    recalcPosition();
    setOpen(true);
  }, [editTrigger, editor, recalcPosition, setOpen]);

  if (!editor) return null;

  const isActive = editor.isActive('annotation');

  const togglePopover = () => {
    if (open) {
      close();
      return;
    }

    // If there's no selection, don't open
    const { from, to } = editor.state.selection;
    if (from === to) return;

    // Pre-fill with existing annotation text when cursor is on an annotation
    const existingText = editor.getAttributes('annotation').text as string | undefined;
    setAnnotationText(existingText || '');
    recalcPosition();
    setOpen(true);
  };

  const saveAnnotation = () => {
    const text = annotationText.trim();
    if (!text) {
      close();
      return;
    }
    editor.chain().focus().setAnnotation({ text }).run();
    lastTriggerRef.current = null;
    close();
  };

  const removeAnnotation = () => {
    editor.chain().focus().unsetAnnotation().run();
    lastTriggerRef.current = null;
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveAnnotation();
    if (e.key === 'Escape') close();
  };

  const hasSelection = !editor.state.selection.empty;

  const isToolbar = variant === 'toolbar';

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePopover}
        title={hasSelection ? 'Adicionar anotação' : 'Selecione um texto primeiro'}
        className={
          isToolbar
            ? `p-2 rounded-lg transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800'
              } ${!hasSelection && !open ? 'opacity-40' : ''}`
            : `p-1.5 rounded-md transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
        }
      >
        <MessageSquarePlus className={isToolbar ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </button>

      {open && (
        <div
          style={dropdownStyle}
          className="fixed z-[9999] min-w-[260px] max-w-[320px] bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-xl p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-dark-400 uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquareText className="h-3.5 w-3.5" />
              Anotação
            </span>
            <button
              type="button"
              onClick={close}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua anotação..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-800 dark:text-dark-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-400 dark:text-dark-450">
              {annotationText.length} caracteres
            </span>
            <div className="flex items-center gap-1.5">
              {isActive && (
                <button
                  type="button"
                  onClick={removeAnnotation}
                  title="Remover anotação"
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  Remover
                </button>
              )}
              <button
                type="button"
                onClick={saveAnnotation}
                disabled={!annotationText.trim()}
                title="Salvar (⌘Enter)"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Save className="h-3 w-3" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
