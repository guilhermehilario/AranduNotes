import React from 'react';

interface SectionTitleProps {
  icon: React.ReactNode;
  label: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ icon, label }) => (
  <label
    className="text-sm font-bold flex items-center gap-2"
    style={{ color: 'var(--text-primary)' }}
  >
    {icon}
    {label}
  </label>
);
