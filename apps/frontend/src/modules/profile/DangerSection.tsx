import React from 'react';
import { ChevronRight } from 'lucide-react';

interface DangerSectionProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}

export const DangerSection: React.FC<DangerSectionProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all cursor-pointer text-left group"
    style={{
      background: 'rgba(244,63,94,0.06)',
      border: '1px solid rgba(244,63,94,0.2)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(244,63,94,0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(244,63,94,0.06)';
    }}
  >
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform"
      style={{ background: 'rgba(244,63,94,0.15)' }}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1">
      <span className="text-sm font-bold" style={{ color: '#FB7185' }}>
        {title}
      </span>
      <p className="text-[10px]" style={{ color: 'rgba(251,113,133,0.7)' }}>
        {description}
      </p>
    </div>
    <ChevronRight className="h-4 w-4" style={{ color: 'rgba(244,63,94,0.4)' }} />
  </button>
);
