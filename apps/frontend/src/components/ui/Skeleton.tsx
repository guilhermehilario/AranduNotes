import React from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded-lg',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-2xl',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-dark-800 ${variantClasses[variant]} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
};
