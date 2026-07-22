import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

/**
 * ProgressBar — Barra de progresso reutilizável.
 * Extraída da breakdown "Por Caderno" do StudyProgressSummary.
 * SRP: apenas renderiza uma barra de progresso com label opcional.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color = 'bg-brand-500',
  showLabel = false,
  size = 'sm',
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${heightClass} bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium text-slate-400 dark:text-dark-400 flex-shrink-0">
          {value}/{max}
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
