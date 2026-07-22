import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, type = 'text', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border ${
              error
                ? 'border-rose-500 focus:ring-rose-200 dark:border-rose-500/50'
                : 'border-slate-200 focus:ring-brand-100 dark:border-dark-700 dark:focus:ring-brand-900/20'
            } rounded-xl text-slate-900 dark:text-dark-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:border-brand-500 dark:focus:border-brand-600 transition-all duration-200 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-dark-950 ${isPassword ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-dark-400 dark:hover:text-dark-200 transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
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
