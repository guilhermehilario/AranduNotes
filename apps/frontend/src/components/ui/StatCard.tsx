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
    <div
      className="flex items-center gap-3.5 p-4 rounded-2xl"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
        <div className={colorClass}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide truncate" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
        <p className="text-xl font-heading font-extrabold mt-0.5" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        {sublabel && (
          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
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
