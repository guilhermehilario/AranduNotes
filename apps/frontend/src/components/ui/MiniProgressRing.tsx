import React from 'react';

interface MiniProgressRingProps {
  value: number;
  size?: number;
}

/**
 * MiniProgressRing — Anel de progresso SVG extraído de StudyProgressSummary.
 * SRP: este componente apenas renderiza um anel de progresso.
 */
export const MiniProgressRing: React.FC<MiniProgressRingProps> = ({
  value,
  size = 44,
}) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 70
      ? 'stroke-emerald-500'
      : value >= 40
        ? 'stroke-amber-500'
        : 'stroke-rose-500';

  return (
    <svg width={size} height={size} className="-rotate-90 flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="fill-none stroke-slate-100 dark:stroke-dark-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`fill-none ${color} transition-all duration-700 ease-out`}
      />
    </svg>
  );
};

export default MiniProgressRing;
