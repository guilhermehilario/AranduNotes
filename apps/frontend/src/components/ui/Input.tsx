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
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none transition-all duration-200 disabled:opacity-50 ${isPassword ? 'pr-10' : ''} ${className}`}
            style={{
              background: error ? 'var(--bg-surface)' : 'var(--bg-surface)',
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
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
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
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
