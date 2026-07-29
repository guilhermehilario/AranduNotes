import React from 'react';
import { Check } from 'lucide-react';

interface CheckmarkProps {
  visible: boolean;
}

export const Checkmark: React.FC<CheckmarkProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ background: 'var(--primary)' }}
    >
      <Check className="h-3 w-3" style={{ color: 'var(--feedback-active)' }} strokeWidth={3} />
    </div>
  );
};
