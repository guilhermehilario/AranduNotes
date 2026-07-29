import React from 'react';

interface ToggleRowProps {
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  isFirst?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({ icon, label, description, checked, onChange, isFirst }) => {
  return (
    <div
      className="flex items-center gap-3 py-3.5"
      style={{
        borderTop: isFirst ? 'none' : '1px solid var(--border-color)',
      }}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0"
        style={{
          background: checked ? '#8b5cf6' : 'var(--border-color)',
        }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
};
