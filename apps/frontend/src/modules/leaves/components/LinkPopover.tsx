import { useState, useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { Link2, Link2Off, Save } from 'lucide-react';
import { useDropdown } from '../hooks/useDropdown';

interface LinkPopoverProps {
  editor: Editor | null;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

export const LinkPopover: React.FC<LinkPopoverProps> = ({ editor }) => {
  const { open, setOpen, containerRef, buttonRef, dropdownStyle, recalcPosition } = useDropdown({ scrollClose: false });
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const openPopover = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setUrl(previousUrl);
    recalcPosition();
    setOpen(true);
  }, [editor, recalcPosition, setOpen]);

  const saveLink = () => {
    if (!editor) return;
    if (url.trim()) {
      const href = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
      editor.chain().focus().setLink({ href }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setOpen(false);
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveLink();
    if (e.key === 'Escape') setOpen(false);
  };

  const hasLink = editor?.isActive('link') ?? false;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={openPopover}
        title={`Link (${isMac ? '⌘K' : 'Ctrl+K'})`}
        className={`p-2 rounded-lg transition-all duration-150 cursor-pointer ${
          hasLink
            ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800'
        }`}
      >
        <Link2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          style={dropdownStyle}
          className="fixed z-[9999] mt-0 min-w-[280px] bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-xl p-3"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://exemplo.com"
              className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-800 dark:text-dark-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="button"
              onClick={saveLink}
              title="Salvar link"
              className="p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
            </button>
            {hasLink && (
              <button
                type="button"
                onClick={removeLink}
                title="Remover link"
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                <Link2Off className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
