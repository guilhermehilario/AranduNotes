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
  /**
   * Quando false, o body vira `flex flex-col min-h-0` e o conteúdo assume o
   * próprio scroll interno (ex.: AbasComScroll) — o `overflow-y: auto` fica
   * apenas na área interna do conteúdo. O body mantém `overflow-y-auto` apenas
   * como FALLBACK (não gera scrollbar duplo quando o scroll interno existe).
   * Padrão: true.
   */
  scrollable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  scrollable = true,
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
        className="fixed inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Content Container */}
      <div
        className={`relative w-full rounded-3xl flex flex-col max-h-[calc(100dvh-2rem)] animate-in fade-in-50 zoom-in-95 duration-200 ${sizeClasses[size]}`}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 flex-shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3 className="text-xl font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 rounded-lg"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </Button>
        </div>

        {/* Body */}
        <div
          className={`px-4 py-5 sm:px-6 sm:py-6 flex-grow ${
            scrollable
              ? 'overflow-y-auto overscroll-contain'
              : 'overflow-y-auto overscroll-contain flex flex-col min-h-0'
          }`}
          style={{ color: 'var(--text-primary)' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-4 py-4 sm:px-6 flex items-center justify-end gap-3 flex-shrink-0 flex-wrap"
            style={{
              background: 'var(--bg-surface-hover)',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
