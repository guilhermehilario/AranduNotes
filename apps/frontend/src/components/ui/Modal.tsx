import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.tsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Content Container */}
      <div
        className={`relative w-full bg-white dark:bg-dark-900 rounded-3xl shadow-xl border border-slate-100 dark:border-dark-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 ${sizeClasses[size]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 dark:border-dark-800/60">
          <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-dark-50">
            {title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-dark-400" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-grow text-slate-700 dark:text-dark-200">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-dark-950/50 border-t border-slate-50 dark:border-dark-800/60 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
