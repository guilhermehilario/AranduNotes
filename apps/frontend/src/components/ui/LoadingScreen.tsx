import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface LoadingScreenProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'spinner' | 'refresh';
}

/**
 * LoadingScreen — Componente de carregamento centralizado.
 * Consolida o padrão repetido de loading spinner em múltiplas views.
 *
 * @example
 * <LoadingScreen />
 * <LoadingScreen size="sm" variant="refresh" />
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  size = 'lg',
  className = '',
  variant = 'spinner',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const Icon = variant === 'refresh' ? RefreshCw : Loader2;

  return (
    <div
      className={`h-[60vh] flex items-center justify-center ${className}`}
    >
      <Icon
        className={`${sizeClasses[size]} animate-spin text-brand-500`}
      />
    </div>
  );
};

export default LoadingScreen;
