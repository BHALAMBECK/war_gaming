import {
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';

interface TiltCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Stronger tilt on large feature tiles */
  intensity?: 'normal' | 'high';
}

/** Aceternity-style 3D tilt + glare (pointer only, no motion library). */
export function TiltCard({
  children,
  className = '',
  intensity = 'normal',
  onPointerMove,
  onPointerLeave,
  style,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const max = intensity === 'high' ? 14 : 9;

  const handleMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -2 * max;
      const ry = (px - 0.5) * 2 * max;
      el.style.setProperty('--tilt-x', `${rx}deg`);
      el.style.setProperty('--tilt-y', `${ry}deg`);
      el.style.setProperty('--glare-x', `${px * 100}%`);
      el.style.setProperty('--glare-y', `${py * 100}%`);
    }
    onPointerMove?.(event);
  };

  const handleLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (el) {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    }
    onPointerLeave?.(event);
  };

  const mergedStyle: CSSProperties = {
    ...style,
    ['--tilt-max' as string]: max,
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`ops-tilt-card ${className}`.trim()}
      style={mergedStyle}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      <span className="ops-tilt-glare" aria-hidden />
      <span className="ops-tilt-content">{children}</span>
    </button>
  );
}
