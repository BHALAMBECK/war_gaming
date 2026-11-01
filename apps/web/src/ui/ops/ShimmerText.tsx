import type { ReactNode } from 'react';

interface ShimmerTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'span';
  className?: string;
}

export function ShimmerText({
  children,
  as: Tag = 'span',
  className = '',
}: ShimmerTextProps) {
  return (
    <Tag className={`ops-shimmer-text ${className}`.trim()}>{children}</Tag>
  );
}
