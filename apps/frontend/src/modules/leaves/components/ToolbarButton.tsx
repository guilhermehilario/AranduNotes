import React from 'react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive,
  disabled,
  title,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex-shrink-0 p-2 rounded-lg transition-all duration-150 cursor-pointer select-none ${
      disabled
        ? 'text-slate-300 dark:text-dark-600 cursor-not-allowed'
        : isActive
          ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 shadow-sm ring-1 ring-brand-300/40 dark:ring-brand-600/40'
          : 'text-slate-500 hover:bg-slate-100 dark:text-dark-400 dark:hover:bg-dark-800'
    }`}
  >
    {children}
  </button>
);
