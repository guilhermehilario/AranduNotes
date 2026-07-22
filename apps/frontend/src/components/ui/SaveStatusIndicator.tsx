import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
  className?: string;
}

/**
 * SaveStatusIndicator — Indicador animado de salvamento.
 * Consolida duplicação entre AppLayout (editor) e StudyView (sessão de estudo).
 *
 * @example
 * <SaveStatusIndicator status={saveStatus} />
 * <SaveStatusIndicator
 *   status="saving"
 *   savingLabel="Salvando alterações..."
 *   savedLabel="Salvo!"
 * />
 */
export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  savingLabel = 'Salvando',
  savedLabel = 'Salvo',
  errorLabel = 'Falha ao salvar',
  className = '',
}) => {
  if (status === 'saving') {
    return (
      <span
        className={`flex items-center gap-1.5 text-xs font-semibold text-brand-500 animate-in fade-in duration-200 ${className}`}
      >
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300 animate-pulse [animation-delay:300ms]" />
        </span>
        {savingLabel}
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span
        className={`flex items-center gap-1 text-xs font-semibold text-emerald-500 animate-in fade-in duration-300 ${className}`}
      >
        <Check className="h-3.5 w-3.5" /> {savedLabel}
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        className={`flex items-center gap-1 text-xs font-semibold text-rose-500 animate-in fade-in duration-300 ${className}`}
      >
        <AlertTriangle className="h-3.5 w-3.5" /> {errorLabel}
      </span>
    );
  }

  return null;
};

export default SaveStatusIndicator;
