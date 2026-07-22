import React from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

/**
 * ConfirmDialog — Diálogo de confirmação estilizado.
 * Substitui os window.confirm() espalhados pelo código.
 *
 * @example
 * <ConfirmDialog
 *   isOpen={isConfirmOpen}
 *   onClose={() => setIsConfirmOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Excluir item?"
 *   message="Esta ação não pode ser desfeita."
 *   variant="danger"
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-slate-600 dark:text-dark-300">{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
