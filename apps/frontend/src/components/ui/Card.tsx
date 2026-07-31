import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl p-6 max-sm:p-4 min-w-0 break-words transition-all duration-150 ${
        hoverable
          ? 'clickable hover:shadow-md hover:-translate-y-0.5'
          : ''
      } ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: hoverable ? '0 4px 20px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`pb-4 mb-4 flex items-center justify-between ${className}`}
      style={{ borderBottom: '1px solid var(--border-color)' }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`pt-4 mt-4 flex items-center justify-between ${className}`}
      style={{ borderTop: '1px solid var(--border-color)' }}
      {...props}
    >
      {children}
    </div>
  );
};
