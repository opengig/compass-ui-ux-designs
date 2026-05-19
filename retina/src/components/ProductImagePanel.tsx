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

export function ProductImagePanel({ article, width }: ProductImagePanelProps) {
  const images = React.useMemo(() => getProductImages(article.barcode, { count: 6 }), [article.barcode]);
  const [selectedOrdinal, setSelectedOrdinal] = React.useState<number>(1);
  const [zoom, setZoom] = React.useState<number>(1);
  const [lens, setLens] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [fullZoom, setFullZoom] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setSelectedOrdinal(1);
    setZoom(1);
    setLens(null);
    setFullZoom(false);
  }, [article.id]);

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

  // Keyboard nav while in full zoom
  React.useEffect(() => {
    if (!fullZoom) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullZoom(false);
      } else if (event.key === 'ArrowRight') {
        cycleImage(1);
      } else if (event.key === 'ArrowLeft') {
        cycleImage(-1);
      } else if (event.key === '+' || event.key === '=') {
        setZoom((prev) => Math.min(3, prev + 0.1));
      } else if (event.key === '-') {
        setZoom((prev) => Math.max(0.5, prev - 0.1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullZoom, cycleImage]);

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (fullZoom) {
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
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
            disabled={zoom >= 3}
            title="Zoom in"
            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFullZoom(true)}
            title="Full zoom"
            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image canvas with lens hover */}
      <div className="flex-1 flex items-center justify-center px-2 min-h-0 overflow-hidden">
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
            <ImageWithFallback image={active} className="max-w-full max-h-[78vh] object-contain" />
          </div>

          {lens && !fullZoom ? (
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

      {/* Full zoom overlay */}
      {fullZoom ? (
        <FullZoomOverlay
          article={article}
          images={images}
          selectedOrdinal={selectedOrdinal}
          onSelectOrdinal={setSelectedOrdinal}
          onClose={() => setFullZoom(false)}
          onCycle={cycleImage}
        />
      ) : null}
    </div>
  );
}

function FullZoomOverlay({
  article,
  images,
  selectedOrdinal,
  onSelectOrdinal,
  onClose,
  onCycle,
}: {
  article: ArticleData;
  images: ProductImage[];
  selectedOrdinal: number;
  onSelectOrdinal: (ordinal: number) => void;
  onClose: () => void;
  onCycle: (direction: 1 | -1) => void;
}) {
  const [zoom, setZoom] = React.useState(1);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const active = images.find((image) => image.ordinal === selectedOrdinal) ?? images[0];

  React.useEffect(() => {
    setZoom(1);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      scrollRef.current.scrollLeft = 0;
    }
  }, [selectedOrdinal]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) {
      return;
    }
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !scrollRef.current) {
      return;
    }
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
    scrollRef.current.scrollTop = dragRef.current.scrollTop - dy;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  if (!active) {
    return null;
  }

  return (
    <div
      className="fixed top-14 bottom-0 left-0 z-40 flex flex-col bg-background/95 backdrop-blur"
      style={{ right: 'var(--detail-pane-width, clamp(360px, 38%, 720px))' }}
      role="dialog"
      aria-label={`${article.name} — image viewer`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/70">
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="text-[12.5px] font-semibold text-foreground truncate max-w-[40ch]">
          {article.name}
        </span>
        <span className="text-[11px] text-muted-foreground hidden md:inline">
          · {active.label}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => onCycle(-1)}
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center"
            title="Previous image (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCycle(1)}
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center"
            title="Next image (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="mx-2 h-5 w-px bg-border" />
          <button
            onClick={() => setZoom((prev) => Math.max(0.75, prev - 0.05))}
            disabled={zoom <= 0.75}
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((prev) => Math.min(1, prev + 0.05))}
            disabled={zoom >= 1}
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pannable canvas */}
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex-1 overflow-auto cursor-grab active:cursor-grabbing retina-thin-scroll"
        style={{ touchAction: 'none' }}
      >
        <div className="min-w-full min-h-full flex items-center justify-center p-6">
          <ImageWithFallback
            image={active}
            className="max-w-full max-h-[calc(100vh-15rem)] object-contain select-none"
            draggable={false}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* Bottom thumbnails strip */}
      <div className="border-t border-border bg-card/70 px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
        {images.map((image) => {
          const isActive = image.ordinal === selectedOrdinal;
          return (
            <button
              key={image.ordinal}
              onClick={() => onSelectOrdinal(image.ordinal)}
              title={image.label}
              className={`shrink-0 w-12 h-12 rounded-md overflow-hidden transition-all ${
                isActive
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-card'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <ImageWithFallback image={image} className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
