import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  title?: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

/** Mobbin-style pill tray; sliding highlight (no animation library). */
export function SegmentedControl({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  layout = 'horizontal',
  size = 'md',
  fullWidth,
  className = '',
}: SegmentedControlProps) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = options.filter((o) => !o.disabled);
    const idx = enabled.findIndex((o) => o.value === value);
    if (idx < 0) return;

    let next = idx;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (idx + 1) % enabled.length;
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (idx - 1 + enabled.length) % enabled.length;
      event.preventDefault();
    } else if (event.key === 'Home') {
      next = 0;
      event.preventDefault();
    } else if (event.key === 'End') {
      next = enabled.length - 1;
      event.preventDefault();
    } else {
      return;
    }
    onChange(enabled[next]!.value);
  };

  const style = {
    '--seg-count': options.length,
    '--seg-active': activeIndex,
  } as CSSProperties;

  return (
    <div
      className={[
        'ops-segmented',
        layout === 'vertical' ? 'vertical' : '',
        size === 'sm' ? 'sm' : '',
        fullWidth ? 'full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      <span className="ops-segmented-pill" aria-hidden />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={opt.title}
            disabled={opt.disabled}
            className={`ops-segmented-item${active ? ' active' : ''}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
