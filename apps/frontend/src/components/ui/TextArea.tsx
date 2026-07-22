import React from 'react';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * TextArea — Componente de textarea reutilizável com estilo consistente.
 * Consolida a estilização de textarea repetida em NotebookView, DashboardView,
 * TagsManagementView, EditorView, ProfileModal.
 */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', id, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-slate-700 dark:text-dark-200"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border ${
            error
              ? 'border-rose-500 focus:ring-rose-200 dark:border-rose-500/50'
              : 'border-slate-200 focus:ring-brand-100 dark:border-dark-700 dark:focus:ring-brand-900/20'
          } rounded-xl text-slate-900 dark:text-dark-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:border-brand-500 dark:focus:border-brand-600 transition-all duration-200 resize-none ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-500 font-medium tracking-wide">
            {error}
          </span>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
