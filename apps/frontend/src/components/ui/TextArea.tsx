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
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none transition-all duration-200 resize-none ${className}`}
          style={{
            background: 'var(--bg-surface)',
            borderColor: error ? '#F43F5E' : 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          {...props}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = 'var(--border-active)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = 'var(--border-color)';
            props.onBlur?.(e);
          }}
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
