import React from 'react';
import { User } from 'lucide-react';
import type { PresenceStatus } from '../types';

const STATUS_COLORS: Record<PresenceStatus, string> = {
  available: 'bg-emerald-500',
  busy: 'bg-amber-500',
  invisible: 'bg-slate-400',
  offline: 'bg-slate-300 dark:bg-slate-600',
};

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: PresenceStatus;
}

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const DOT_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', status }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={`${SIZE_CLASS[size]} rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-300 overflow-hidden`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <User className="h-1/2 w-1/2" />
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${DOT_SIZE[size]} rounded-full ${STATUS_COLORS[status]} ring-2 ring-[var(--bg-surface)]`}
          title={status}
        />
      )}
    </div>
  );
};

export const PresenceDot: React.FC<{ status: PresenceStatus; className?: string }> = ({
  status,
  className = '',
}) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]} ${className}`}
  />
);
