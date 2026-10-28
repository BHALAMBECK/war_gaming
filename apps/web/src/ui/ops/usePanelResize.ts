import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

type Axis = 'x' | 'y';

/**
 * Pointer-drag resize helper. `sign` flips direction (e.g. right panel grows when
 * dragging left → sign = -1).
 */
export function usePanelResize(
  axis: Axis,
  onResize: (next: number) => void,
  getCurrent: () => number,
  opts: { min: number; max: number; sign?: number }
) {
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);
  const sign = opts.sign ?? 1;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current) return;
      const pos = axis === 'x' ? e.clientX : e.clientY;
      const delta = (pos - startPos.current) * sign;
      const next = Math.min(
        opts.max,
        Math.max(opts.min, startSize.current + delta)
      );
      onResize(next);
    },
    [axis, onResize, opts.max, opts.min, sign]
  );

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      startPos.current = axis === 'x' ? e.clientX : e.clientY;
      startSize.current = getCurrent();
      document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [axis, getCurrent]
  );

  return { onPointerDown };
}
