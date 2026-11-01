import { useRef, type ReactNode } from 'react';

interface StageSpotlightProps {
  children: ReactNode;
  className?: string;
}

/** Aceternity-style cursor spotlight for staging heroes (CSS-only glow). */
export function StageSpotlight({ children, className = '' }: StageSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      className={`ops-spotlight-zone ${className}`.trim()}
      onPointerMove={onPointerMove}
    >
      {children}
    </div>
  );
}
