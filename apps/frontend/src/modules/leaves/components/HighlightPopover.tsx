import type { Editor } from '@tiptap/react';
import { Highlighter } from 'lucide-react';
import { useDropdown } from '../hooks/useDropdown';

interface HighlightColor {
  name: string;
  color: string;
  tailwind: string;
}

const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: 'Amarelo', color: '#fef08a', tailwind: 'bg-yellow-200' },
  { name: 'Dourado', color: 'oklch(0.78 0.14 85)', tailwind: 'bg-[oklch(0.78_0.14_85)]' },
  { name: 'Turquesa', color: 'oklch(0.72 0.16 195)', tailwind: 'bg-[oklch(0.72_0.16_195)]' },
  { name: 'Roxo', color: 'oklch(0.52 0.21 260)', tailwind: 'bg-[oklch(0.52_0.21_260)]' },
];

interface HighlightPopoverProps {
  editor: Editor | null;
  variant?: 'toolbar' | 'bubble';
}

export const HighlightPopover: React.FC<HighlightPopoverProps> = ({
  editor,
  variant = 'toolbar',
}) => {
  const { open, setOpen, close, containerRef, buttonRef, dropdownStyle, recalcPosition } = useDropdown();
  const isToolbar = variant === 'toolbar';

  if (!editor) return null;

  const toggleOpen = () => {
    if (!open) recalcPosition();
    setOpen(!open);
  };

  const selectColor = (color: string) => {
    const isActive = editor.isActive('highlight', { color });
    if (isActive) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    close();
  };

  const activeColor = HIGHLIGHT_COLORS.find(
    (c) => editor.isActive('highlight', { color: c.color })
  );
  const isHighlighted = !!activeColor;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        title="Destacar texto"
        className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
          isToolbar
            ? isHighlighted
              ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm px-2 py-2'
              : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800 px-2 py-2'
            : isHighlighted
              ? 'bg-white/20 text-white px-1.5 py-1.5'
              : 'text-white/70 hover:bg-white/10 hover:text-white px-1.5 py-1.5'
        }`}
      >
        <Highlighter className={isToolbar ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        {isToolbar && activeColor && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: activeColor.color }}
          />
        )}
        {isToolbar && (
          <svg
            className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {open && (
        <div
          style={dropdownStyle}
          className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-xl shadow-xl border bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 p-2"
        >
          <div className="text-[11px] font-semibold text-slate-400 dark:text-dark-450 uppercase tracking-wide px-2 pb-1.5">
            Cor do destaque
          </div>
          <div className="flex flex-col gap-0.5">
            {HIGHLIGHT_COLORS.map((hc) => {
              const selected = editor.isActive('highlight', { color: hc.color });
              return (
                <button
                  key={hc.color}
                  type="button"
                  onClick={() => selectColor(hc.color)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    selected
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-750'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-md border border-slate-200 dark:border-dark-700 flex-shrink-0"
                    style={{ background: hc.color }}
                  />
                  <span className="flex-1 text-left">{hc.name}</span>
                  {selected && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {isHighlighted && (
            <>
              <div className="border-t border-slate-100 dark:border-dark-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  close();
                }}
                className="w-full text-left px-2 py-2 rounded-lg text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                Remover destaque
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
