import React from 'react';

type ResizerProps = {
  onResize: (deltaPx: number) => void;
  onResizeEnd?: () => void;
  ariaLabel?: string;
};

/**
 * Vertical drag handle. Drag horizontally to resize neighbouring panes.
 * Renders a thin 4px hit area that highlights on hover.
 */
export function Resizer({ onResize, onResizeEnd, ariaLabel = 'Resize pane' }: ResizerProps) {
  const lastXRef = React.useRef<number | null>(null);
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => {
    if (!dragging) {
      return;
    }
    const onMove = (event: PointerEvent) => {
      if (lastXRef.current == null) {
        return;
      }
      const delta = event.clientX - lastXRef.current;
      lastXRef.current = event.clientX;
      if (delta !== 0) {
        onResize(delta);
      }
    };
    const onUp = () => {
      lastXRef.current = null;
      setDragging(false);
      onResizeEnd?.();
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, onResize, onResizeEnd]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      tabIndex={0}
      onPointerDown={(event) => {
        lastXRef.current = event.clientX;
        setDragging(true);
      }}
      className={`relative shrink-0 w-1 cursor-col-resize group ${
        dragging ? 'bg-primary/40' : 'bg-transparent hover:bg-primary/20'
      } transition-colors`}
      style={{ touchAction: 'none' }}
    >
      <span
        className={`absolute inset-y-0 -left-1 right-0 w-3 ${dragging ? '' : 'group-hover:bg-primary/5'}`}
      />
    </div>
  );
}

const STORAGE_PREFIX = 'retina:pane-width:';

export function usePersistedWidth(key: string, defaultPx: number) {
  const [width, setWidth] = React.useState<number>(() => {
    if (typeof window === 'undefined') {
      return defaultPx;
    }
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!stored) {
      return defaultPx;
    }
    const parsed = Number.parseInt(stored, 10);
    return Number.isFinite(parsed) ? parsed : defaultPx;
  });
  const persist = React.useCallback(
    (next: number) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(Math.round(next)));
      }
    },
    [key],
  );
  return [width, setWidth, persist] as const;
}
