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

const LENS_WIDTH = 240;
const LENS_HEIGHT = 180;
const LENS_MAGNIFICATION = 2.3;

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

function ImageWithFallback({
  image,
  className,
  draggable,
  style,
}: {
  image: ProductImage;
  className?: string;
  draggable?: boolean;
  style?: React.CSSProperties;
}) {
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
      src={image.url}
      alt={image.label}
      onError={() => setErrored(true)}
      className={className}
      style={style}
      draggable={draggable ?? false}
    />
  );
}

export function ProductImagePanel({
  article,
  width,
  expanded = false,
  onToggleExpand,
}: ProductImagePanelProps) {
  const images = React.useMemo(() => getProductImages(article.barcode, { count: 6 }), [article.barcode]);
  const [selectedOrdinal, setSelectedOrdinal] = React.useState<number>(1);
  const [zoom, setZoom] = React.useState<number>(1);
  const [lens, setLens] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setSelectedOrdinal(1);
    setZoom(1);
    setLens(null);
  }, [article.id]);

  // Reset zoom when toggling expanded mode so the image refits cleanly
  React.useEffect(() => {
    setZoom(1);
    setLens(null);
  }, [expanded]);

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

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (expanded) {
      // Disable lens magnifier in expanded mode — actual zoom buttons take over
      return;
    }
    const target = event.currentTarget.getBoundingClientRect();
    setLens({
      x: event.clientX - target.left,
      y: event.clientY - target.top,
      w: target.width,
      h: target.height,
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
            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center"
          >
            {expanded ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
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
        >
          <div
            className="relative max-w-full max-h-full transition-transform"
            style={{ transform: `scale(${zoom})` }}
          >
            <ImageWithFallback
              image={active}
              className={`max-w-full ${expanded ? 'max-h-[82vh]' : 'max-h-[72vh]'} object-contain`}
            />
          </div>

          {lens && !expanded ? (
            <div
              className="pointer-events-none absolute rounded-md border-2 border-primary/70 shadow-soft overflow-hidden"
              style={{
                left: lens.x - LENS_WIDTH / 2,
                top: lens.y - LENS_HEIGHT / 2,
                width: LENS_WIDTH,
                height: LENS_HEIGHT,
                backgroundImage: `url(${active.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${lens.w * LENS_MAGNIFICATION}px ${lens.h * LENS_MAGNIFICATION}px`,
                backgroundPosition: `-${lens.x * LENS_MAGNIFICATION - LENS_WIDTH / 2}px -${
                  lens.y * LENS_MAGNIFICATION - LENS_HEIGHT / 2
                }px`,
                backgroundColor: 'white',
              }}
            />
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

