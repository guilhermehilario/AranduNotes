import type { Editor } from '@tiptap/react';
import { Type } from 'lucide-react';
import { useDropdown } from '../hooks/useDropdown';

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
const modStr = isMac ? '⌘' : 'Ctrl+';
const altStr = isMac ? '⌥' : 'Alt+';

interface HeadingOption {
  level: number | null;
  label: string;
  shortcut: string;
}

const HEADING_OPTIONS: HeadingOption[] = [
  { level: null, label: 'Parágrafo', shortcut: `${modStr}${altStr}0` },
  { level: 1, label: 'Título 1', shortcut: `${modStr}${altStr}1` },
  { level: 2, label: 'Título 2', shortcut: `${modStr}${altStr}2` },
  { level: 3, label: 'Título 3', shortcut: `${modStr}${altStr}3` },
];

function getActiveLevel(editor: Editor): number | null {
  if (editor.isActive('paragraph')) return null;
  for (let i = 1; i <= 3; i++) {
    if (editor.isActive('heading', { level: i })) return i;
  }
  return null;
}

function getActiveLabel(editor: Editor): string {
  const level = getActiveLevel(editor);
  return HEADING_OPTIONS.find((o) => o.level === level)?.label ?? 'Título';
}

interface HeadingSelectorProps {
  editor: Editor | null;
  variant?: 'toolbar' | 'bubble';
}

export const HeadingSelector: React.FC<HeadingSelectorProps> = ({
  editor,
  variant = 'toolbar',
}) => {
  const { open, setOpen, close, containerRef, buttonRef, dropdownStyle, recalcPosition } = useDropdown();
  const isToolbar = variant === 'toolbar';

  if (!editor) return null;

  const activeLevel = getActiveLevel(editor);
  const activeLabel = getActiveLabel(editor);

  const selectLevel = (level: number | null) => {
    if (level === null) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
    }
    close();
  };

  const handleToggle = () => {
    if (!open) recalcPosition();
    setOpen(!open);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        title={`Estilo de texto (${activeLabel})`}
        className={`inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
          isToolbar
            ? activeLevel
              ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800'
            : activeLevel
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
        } ${isToolbar ? 'px-2 py-2' : 'px-1.5 py-1.5'}`}
      >
        <Type className={isToolbar ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        {isToolbar && (
          <span className="hidden sm:inline text-xs font-semibold max-w-[5rem] truncate">
            {activeLabel}
          </span>
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
          className={`fixed z-[9999] mt-0 min-w-[160px] overflow-hidden rounded-xl shadow-xl border ${
            isToolbar
              ? 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700'
              : 'bg-slate-800 dark:bg-dark-800 border-slate-700 dark:border-dark-700'
          }`}
        >
          {HEADING_OPTIONS.map((option) => {
            const isSelected = activeLevel === option.level;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => selectLevel(option.level)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ${
                  isToolbar
                    ? isSelected
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-750'
                    : isSelected
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{option.label}</span>
                <kbd
                  className={`text-[10px] tracking-wider ml-4 ${
                    isToolbar
                      ? 'text-slate-400 dark:text-dark-450'
                      : 'text-white/40'
                  }`}
                >
                  {option.shortcut}
                </kbd>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
