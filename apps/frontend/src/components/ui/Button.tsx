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
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    // Variantes de estilos usando a paleta do StudyNotes AI
    const variantClasses = {
      primary:
        'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10 focus:ring-brand-400 dark:bg-brand-600 dark:hover:bg-brand-500',
      secondary:
        'bg-slate-200 hover:bg-slate-300 text-slate-800 focus:ring-slate-400 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-dark-100',
      danger:
        'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10 focus:ring-rose-400',
      outline:
        'border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700 focus:ring-slate-400 dark:border-dark-700 dark:text-dark-200 dark:hover:bg-dark-800',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400 dark:text-dark-200 dark:hover:bg-dark-800/50',
    };

    // Tamanhos do botão
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-base gap-2',
      lg: 'px-6 py-3.5 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
