import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface MovingBorderProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/** Magic UI–style spinning gradient frame (free CSS, no deps). */
export function MovingBorder({
  children,
  className = '',
  ...rest
}: MovingBorderProps) {
  return (
    <button
      type="button"
      className={`ops-moving-border ${className}`.trim()}
      {...rest}
    >
      <span className="ops-moving-border-track" aria-hidden />
      <span className="ops-moving-border-inner">{children}</span>
    </button>
  );
}
