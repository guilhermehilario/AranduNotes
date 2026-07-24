import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    // Classes base com foco e transições suaves
    const baseClass =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] cursor-pointer';

    // Variantes de estilos usando a paleta Dark Elegance
    const variantClasses = {
      primary:
        'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10 focus-visible:outline-brand-400 dark:bg-[var(--primary)] dark:hover:bg-brand-500',
      secondary:
        'bg-slate-200 hover:bg-slate-300 text-slate-800 focus-visible:outline-slate-400 dark:bg-[var(--bg-surface-hover)] dark:hover:bg-[var(--bg-surface-active)] dark:text-[var(--text-primary)]',
      danger:
        'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10 focus-visible:outline-rose-400',
      outline:
        'border bg-transparent hover:bg-[var(--bg-surface-hover)] text-slate-700 focus-visible:outline-[var(--primary)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--bg-surface-hover)]',
      ghost:
        'bg-transparent hover:bg-[var(--bg-surface-hover)] text-slate-700 focus-visible:outline-[var(--primary)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--bg-surface-hover)]',
    };

    // Tamanhos do botão
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-base gap-2',
      lg: 'px-6 py-3.5 text-lg gap-2.5',
    };

    // Classes comuns de foco via keyboard
    const focusVisibleClass =
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]';

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${focusVisibleClass} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
