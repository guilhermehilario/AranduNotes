import { useState, useEffect, useRef, memo } from 'react';
import type { Editor } from '@tiptap/react';
import { MessageSquareText } from 'lucide-react';

interface AnnotationEntry {
  id: string;
  highlightedText: string;
  annotationText: string;
}

interface AnnotationSidebarProps {
  editor: Editor | null;
}

const AnnotationSidebarComponent: React.FC<AnnotationSidebarProps> = ({ editor }) => {
  const [annotations, setAnnotations] = useState<AnnotationEntry[]>([]);
  const htmlHashRef = useRef('');

  // Re-scan annotations apenas quando o HTML do editor MUDAR de fato.
  // Evita parsear o DOM inteiro a cada caractere digitado.
  useEffect(() => {
    if (!editor) return;

    const updateAnnotations = () => {
      const html = editor.getHTML();
      // Só atualiza se o HTML mudou desde a última varredura
      if (html === htmlHashRef.current) return;
      htmlHashRef.current = html;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const marks = doc.querySelectorAll('span.annotation-anchor[data-annotation]');
      const entries: AnnotationEntry[] = [];
      marks.forEach((mark, index) => {
        const text = mark.textContent?.trim() || '';
        const annotation = mark.getAttribute('data-annotation') || '';
        if (text && annotation) {
          entries.push({
            id: `annotation-${index}-${text.slice(0, 10).replace(/\s/g, '-')}`,
            highlightedText: text,
            annotationText: annotation,
          });
        }
      });
      setAnnotations(entries);
    };

    updateAnnotations();
    editor.on('update', updateAnnotations);
    return () => { editor.off('update', updateAnnotations); };
  }, [editor]);

  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-500">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-sm text-slate-800 dark:text-dark-100">
            Nenhuma anotação
          </h4>
          <p className="text-xs text-slate-500 dark:text-dark-350 mt-1">
            Selecione um texto no editor, clique em{" "}
            <span className="font-semibold text-brand-500">Marcar</span>{" "}
            e adicione uma anotação.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide">
          {annotations.length} anotação{annotations.length !== 1 ? 'ões' : ''}
        </span>
      </div>

      {annotations.map((entry) => (
        <div
          key={entry.id}
          className="group bg-slate-50 dark:bg-dark-950/30 border border-slate-100 dark:border-dark-850 rounded-xl p-3 transition-all hover:border-brand-200 dark:hover:border-brand-900/40 cursor-pointer"
          onClick={() => {
            if (editor) {
              // Focus the editor - the user can then find the annotation visually
              editor.commands.focus();
            }
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 dark:text-dark-200 font-medium truncate">
                {entry.highlightedText}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-dark-400 mt-1 line-clamp-2">
                {entry.annotationText}
              </p>
            </div>
            <div className="flex-shrink-0 w-5 h-5 rounded-md bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mt-0.5">
              <MessageSquareText className="h-3 w-3 text-brand-500" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AnnotationSidebar = memo(AnnotationSidebarComponent);
