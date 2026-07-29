import React from 'react';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({ selected, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left w-full cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-active)] ${className}`}
    style={{
      borderRadius: '8px',
      border: selected ? '2px solid var(--border-active)' : '1px solid var(--border-color)',
      background: selected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
    }}
    onMouseEnter={(e) => {
      if (!selected) {
        e.currentTarget.style.background = 'var(--bg-surface-hover)';
        e.currentTarget.style.borderColor = 'var(--text-secondary)';
      }
    }}
    onMouseLeave={(e) => {
      if (!selected) {
        e.currentTarget.style.background = 'var(--bg-surface)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }
    }}
  >
    {children}
  </button>
);
