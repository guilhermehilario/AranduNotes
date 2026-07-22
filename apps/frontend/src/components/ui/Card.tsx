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
      className={`bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800/80 rounded-2xl p-6 shadow-sm shadow-slate-100/50 dark:shadow-none transition-all duration-200 ${
        hoverable
          ? 'hover:shadow-md hover:border-slate-200 dark:hover:border-dark-750 hover:translate-y-[-2px] cursor-pointer'
          : ''
      } ${className}`}
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
      className={`border-b border-slate-50 dark:border-dark-800/60 pb-4 mb-4 flex items-center justify-between ${className}`}
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
      className={`border-t border-slate-50 dark:border-dark-800/60 pt-4 mt-4 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
