import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { ArticleData } from '../data/mockData';
import { getProductImages, type ProductImage } from '../data/offImages';

type ProductImagePanelProps = {
  article: ArticleData;
  width: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

const LENS_SIZE = 180;
const LENS_MAGNIFICATION = 2.6;

function FallbackImage({ image }: { image: ProductImage }) {
  if (image.kind === 'barcode') {
    return (
      <div className="w-full h-full bg-card flex items-center justify-center">
        <div className="flex gap-[1px] items-center">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-foreground"
              style={{ width: i % 3 === 0 ? '2px' : '1px' }}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-muted/40 flex flex-col items-center justify-center gap-1 text-muted-foreground">
      <ImageIcon className="w-5 h-5" />
      <span className="text-[10px] uppercase tracking-wide">{image.label}</span>
    </div>
  );
}

const ImageWithFallback = React.forwardRef<
  HTMLImageElement,
  {
    image: ProductImage;
    className?: string;
    draggable?: boolean;
    style?: React.CSSProperties;
  }
>(function ImageWithFallback({ image, className, draggable, style }, ref) {
  const [errored, setErrored] = React.useState(false);
  React.useEffect(() => {
    setErrored(false);
  }, [image.url]);
  if (errored) {
    return (
      <div className={className} style={style}>
        <FallbackImage image={image} />
      </div>
    );
  }
  return (
    <img
      ref={ref}
      src={image.url}
      alt={image.label}
      onError={() => setErrored(true)}
      className={className}
      style={style}
      draggable={draggable ?? false}
    />
  );
});

export function ProductImagePanel({
  article,
  width,
  expanded = false,
  onToggleExpand,
}: ProductImagePanelProps) {
  const images = React.useMemo(() => getProductImages(article.barcode, { count: 6 }), [article.barcode]);
  const [selectedOrdinal, setSelectedOrdinal] = React.useState<number>(1);
  const [zoom, setZoom] = React.useState<number>(1);
  // Lens position is stored in *container* coordinates plus the image-relative
  // cursor offset (cxImg/cyImg) so the magnifier maths matches what the image
  // is actually showing, not the padded letterbox area around it.
  const [lens, setLens] = React.useState<{
    cx: number;
    cy: number;
    cxImg: number;
    cyImg: number;
    imgW: number;
    imgH: number;
  } | null>(null);
  // Pan offset (CSS px, unscaled) for drag-to-move when expanded + zoomed in.
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = React.useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    setSelectedOrdinal(1);
    setZoom(1);
    setLens(null);
    setPan({ x: 0, y: 0 });
  }, [article.id]);

  // Reset zoom + pan when toggling expanded mode so the image refits cleanly
  React.useEffect(() => {
    setZoom(1);
    setLens(null);
    setPan({ x: 0, y: 0 });
  }, [expanded]);

  // When user returns to 100% zoom, snap pan back to centre
  React.useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  const canPan = expanded && zoom > 1;

  // Mouse-wheel zoom on the image canvas. Bound via useEffect with passive:false
  // because React's synthetic onWheel is passive — preventDefault wouldn't stop
  // the page from scrolling underneath.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxZoom = expanded ? 4 : 3;
    const minZoom = 0.5;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      // Normalise: trackpad pixels vs mouse-line vs page units.
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const step = (event.deltaY * unit) / 800; // ~0.1 per typical mouse notch
      setZoom((prev) => Math.min(maxZoom, Math.max(minZoom, prev - step)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [expanded]);

  const onPanDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };
  const onPanMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  };
  const onPanUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const active = images.find((image) => image.ordinal === selectedOrdinal) ?? images[0] ?? null;

  const cycleImage = React.useCallback(
    (direction: 1 | -1) => {
      if (images.length === 0) {
        return;
      }
      const currentIndex = images.findIndex((image) => image.ordinal === selectedOrdinal);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (safeIndex + direction + images.length) % images.length;
      setSelectedOrdinal(images[nextIndex].ordinal);
      setLens(null);
    },
    [images, selectedOrdinal],
  );

  // Keyboard nav while expanded — ESC handled by QueueScreen, here just arrows + zoom hotkeys
  React.useEffect(() => {
    if (!expanded) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        cycleImage(1);
      } else if (event.key === 'ArrowLeft') {
        cycleImage(-1);
      } else if (event.key === '+' || event.key === '=') {
        setZoom((prev) => Math.min(4, prev + 0.1));
      } else if (event.key === '-') {
        setZoom((prev) => Math.max(0.5, prev - 0.1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded, cycleImage]);

  // Lens is hidden in expanded mode (zoom buttons own that flow) and whenever
  // the zoom controls are already active — the magnifier is for inspecting
  // detail at the base size, redundant once the user has zoomed in.
  const lensEnabled = !expanded && zoom === 1;

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!lensEnabled) {
      if (lens) setLens(null);
      return;
    }
    const container = containerRef.current;
    const imgEl = imgRef.current;
    if (!container || !imgEl) return;
    const containerRect = container.getBoundingClientRect();
    const imgRect = imgEl.getBoundingClientRect();
    const cxImg = event.clientX - imgRect.left;
    const cyImg = event.clientY - imgRect.top;
    // Only fire while the cursor is over the actual rendered image, not the
    // letterboxed padding around it — outside the image there's nothing real
    // to magnify.
    if (cxImg < 0 || cyImg < 0 || cxImg > imgRect.width || cyImg > imgRect.height) {
      if (lens) setLens(null);
      return;
    }
    setLens({
      cx: event.clientX - containerRect.left,
      cy: event.clientY - containerRect.top,
      cxImg,
      cyImg,
      imgW: imgRect.width,
      imgH: imgRect.height,
    });
  };

  if (!active) {
    return (
      <div
        className="flex-1 min-w-0 flex items-center justify-center bg-background text-sm text-muted-foreground"
        style={{ width, flexShrink: 0 }}
      >
        No images
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col bg-background"
      style={{ width, flexShrink: 0 }}
    >
      {/* Thumbnail strip + zoom controls */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        {images.map((image) => {
          const isActive = image.ordinal === selectedOrdinal;
          return (
            <button
              key={image.ordinal}
              onClick={() => {
                setSelectedOrdinal(image.ordinal);
                setLens(null);
              }}
              title={image.label}
              aria-label={image.label}
              className={`w-9 h-9 rounded-md overflow-hidden transition-all ${
                isActive
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <ImageWithFallback image={image} className="w-full h-full object-cover" />
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
            disabled={zoom <= 0.5}
            title="Zoom out"
            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((prev) => Math.min(expanded ? 4 : 3, prev + 0.25))}
            disabled={zoom >= (expanded ? 4 : 3)}
            title="Zoom in"
            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleExpand}
            title={expanded ? 'Collapse image (Esc)' : 'Expand image'}
            aria-label={expanded ? 'Collapse image' : 'Expand image'}
            className={
              expanded
                ? 'ml-1 inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft transition-colors text-[12px] font-semibold'
                : 'w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center'
            }
          >
            {expanded ? (
              <>
                <X className="w-4 h-4" strokeWidth={2.5} />
                Close
              </>
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Image canvas with lens hover — vertical breathing room so the image fits with margin */}
      <div className="flex-1 flex items-center justify-center px-3 py-[5%] min-h-0 overflow-hidden">
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onMouseEnter={onMouseMove}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setLens(null)}
          onPointerDown={onPanDown}
          onPointerMove={onPanMove}
          onPointerUp={onPanUp}
          onPointerCancel={onPanUp}
          style={{
            cursor: canPan ? (dragRef.current ? 'grabbing' : 'grab') : 'default',
            touchAction: canPan ? 'none' : undefined,
          }}
        >
          <div
            className="relative max-w-full max-h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: dragRef.current ? 'none' : 'transform 0.15s ease',
            }}
          >
            <ImageWithFallback
              ref={imgRef}
              image={active}
              className={`max-w-full ${expanded ? 'max-h-[82vh]' : 'max-h-[72vh]'} object-contain select-none`}
              draggable={false}
            />
          </div>

          {lens && lensEnabled ? (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-primary shadow-lg overflow-hidden"
              style={{
                left: lens.cx - LENS_SIZE / 2,
                top: lens.cy - LENS_SIZE / 2,
                width: LENS_SIZE,
                height: LENS_SIZE,
                backgroundImage: `url(${active.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${lens.imgW * LENS_MAGNIFICATION}px ${lens.imgH * LENS_MAGNIFICATION}px`,
                backgroundPosition: `${LENS_SIZE / 2 - lens.cxImg * LENS_MAGNIFICATION}px ${
                  LENS_SIZE / 2 - lens.cyImg * LENS_MAGNIFICATION
                }px`,
                backgroundColor: 'white',
              }}
            >
              {/* center crosshair */}
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/70 ring-2 ring-white"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Prev / Next strip below the image — matches the detail-panel save bar */}
      {images.length > 1 ? (
        <div className="flex-shrink-0 h-12 flex items-center justify-between px-3 border-t border-border bg-card">
          <button
            type="button"
            onClick={() => cycleImage(-1)}
            title="Previous image"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card text-foreground hover:bg-muted/40 transition-colors text-[12.5px] font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <span className="text-[12px] text-muted-foreground font-medium">
            {active.label}
            <span className="text-muted-foreground/60 mx-1.5">·</span>
            <span className="tabular-nums">
              {images.findIndex((image) => image.ordinal === selectedOrdinal) + 1}/{images.length}
            </span>
          </span>
          <button
            type="button"
            onClick={() => cycleImage(1)}
            title="Next image"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card text-foreground hover:bg-muted/40 transition-colors text-[12.5px] font-medium"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

    </div>
  );
}

