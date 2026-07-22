import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, type = 'text', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-dark-200"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border ${
            error
              ? 'border-rose-500 focus:ring-rose-200 dark:border-rose-500/50'
              : 'border-slate-200 focus:ring-brand-100 dark:border-dark-700 dark:focus:ring-brand-900/20'
          } rounded-xl text-slate-900 dark:text-dark-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:border-brand-500 dark:focus:border-brand-600 transition-all duration-200 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-dark-950 ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-500 font-medium tracking-wide">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-xs text-slate-500 dark:text-dark-400">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
