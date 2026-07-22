import React from 'react';
import { Tooltip } from './Tooltip.tsx';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  colorClass: string;
  iconBgClass: string;
  /** Texto de dica explicativa exibido em um tooltip ao hover */
  tooltip?: string;
}

/**
 * StatCard — Card de estatística extraído de StudyProgressSummary.
 * SRP: este componente apenas renderiza um card de métrica.
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  sublabel,
  colorClass,
  iconBgClass,
  tooltip,
}) => {
  const card = (
    <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-dark-900 rounded-2xl border border-slate-100 dark:border-dark-800 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200 dark:hover:border-dark-700">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
        <div className={colorClass}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400 dark:text-dark-400 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-xl font-heading font-extrabold text-slate-800 dark:text-dark-50 mt-0.5">
          {value}
        </p>
        {sublabel && (
          <p className="text-[11px] text-slate-400 dark:text-dark-500 mt-0.5 truncate">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="top">
        {card}
      </Tooltip>
    );
  }

  return card;
};

export default StatCard;
