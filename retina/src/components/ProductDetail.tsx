import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Copy,
  CheckCheck,
  Undo2,
  Redo2,
  ArrowRightLeft,
  Camera,
} from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import { useExpandSections } from '../stores/ExpandSections';
import { IngredientsTable } from './IngredientsTable';
import { ROUTES } from '../router/routes';
import { getProductImages } from '../data/offImages';
import { C } from './nutritionist/data/tokens';
import type { QueueTab } from '../hooks/useQueueFilter';

type ProductDetailProps = {
  selectedArticleId: string | null;
  queueTab: QueueTab;
};

const THUMB_LABELS = ['Front', 'Back', 'Side', 'Barcode'] as const;

function dateOnly(value: string): string {
  // Inputs are formatted like "13 May 2025, 09:30 PM" — strip the time portion.
  const commaIndex = value.indexOf(',');
  return commaIndex === -1 ? value : value.slice(0, commaIndex);
}

function confidenceTone(confidence: number) {
  if (confidence >= 90) {
    return { label: 'High', color: C.gr, bg: C.grBg, border: C.grBdr };
  }
  if (confidence >= 80) {
    return { label: 'Medium', color: C.am, bg: C.amBg, border: C.amBdr };
  }
  return { label: 'Low', color: C.rd, bg: C.rdBg, border: C.rdBdr };
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard not available — silent */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title={`Copy ${label}`}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors align-middle"
      aria-label={`Copy ${label}`}
    >
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function MetaDivider() {
  return <span className="h-3 w-px bg-border shrink-0" />;
}

function Thumb({ url, label }: { url?: string; label: string }) {
  const [errored, setErrored] = React.useState(false);
  React.useEffect(() => setErrored(false), [url]);
  if (!url || errored) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ fontSize: 8, fontWeight: 700, color: C.mutedFg, textTransform: 'uppercase' }}
      >
        {label[0]}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={label}
      onError={() => setErrored(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}

/* ---- Nutritionist-style accordion card (dropdowns — keep unchanged) -- */

function AccordionCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const { expandSignal, collapseSignal } = useExpandSections();

  React.useEffect(() => {
    if (expandSignal > 0) setOpen(true);
  }, [expandSignal]);
  React.useEffect(() => {
    if (collapseSignal > 0) setOpen(false);
  }, [collapseSignal]);

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        backgroundColor: C.card,
        borderRadius: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 transition-colors"
        style={{ height: 52, backgroundColor: 'transparent', borderBottom: open ? `1px solid ${C.border}` : 'none' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.muted)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.fg,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        {open ? <ChevronUp size={14} color={C.mutedFg} /> : <ChevronDown size={14} color={C.mutedFg} />}
      </button>
      {open ? <div style={{ padding: '16px 20px 20px' }}>{children}</div> : null}
    </div>
  );
}

/* ---- Ingredients section — UNCHANGED from the original SME design --- */

function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const { expandSignal, collapseSignal } = useExpandSections();

  React.useEffect(() => {
    if (expandSignal > 0) {
      setOpen(true);
    }
  }, [expandSignal]);

  React.useEffect(() => {
    if (collapseSignal > 0) {
      setOpen(false);
    }
  }, [collapseSignal]);

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        backgroundColor: C.card,
        borderRadius: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 transition-colors"
        style={{ height: 52, backgroundColor: 'transparent', borderBottom: open ? `1px solid ${C.border}` : 'none' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.muted)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span style={{ fontSize: 13, fontWeight: 700, color: C.fg, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {title}
          </span>
          {count != null ? (
            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          ) : null}
        </span>
        {open ? <ChevronUp size={14} color={C.mutedFg} /> : <ChevronDown size={14} color={C.mutedFg} />}
      </button>
      {open ? <div style={{ padding: '16px 20px 20px' }}>{children}</div> : null}
    </div>
  );
}

export function ProductDetail({ selectedArticleId, queueTab }: ProductDetailProps) {
  void queueTab;
  const navigate = useNavigate();
  const reviewStore = useReviewStore();
  const {
    articles,
    getArticleById,
    getUnsavedEditCount,
    saveChanges,
    submitArticle,
    undo,
    redo,
    getCanUndo,
    getCanRedo,
    moveToBucket,
    getArticleEditLog,
  } = reviewStore;
  const article = getArticleById(selectedArticleId) ?? articles[0] ?? null;
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const submitRef = React.useRef<HTMLDivElement | null>(null);
  const [showSubmit, setShowSubmit] = React.useState(false);
  const [comment, setComment] = React.useState('');
  const [moveOpen, setMoveOpen] = React.useState(false);
  const moveRef = React.useRef<HTMLDivElement | null>(null);
  const [activeImg, setActiveImg] = React.useState(0);
  const [imgErr, setImgErr] = React.useState(false);
  const [photoCollapsed, setPhotoCollapsed] = React.useState(false);
  const [imgZoomed, setImgZoomed] = React.useState(false);
  const [imgPan, setImgPan] = React.useState({ x: 0, y: 0 });
  const imgContainerRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef(0);
  const ZOOM = 2.5;

  const images = React.useMemo(
    () => (article ? getProductImages(article.barcode, { count: 4 }) : []),
    [article?.barcode],
  );

  // Close the Move-to picker on outside click / Esc.
  React.useEffect(() => {
    if (!moveOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (moveRef.current && !moveRef.current.contains(e.target as Node)) setMoveOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoveOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [moveOpen]);

  // Reset state when switching articles
  React.useEffect(() => {
    setShowSubmit(false);
    setComment('');
    setActiveImg(0);
    setImgErr(false);
    setImgZoomed(false);
    setImgPan({ x: 0, y: 0 });
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [article?.id]);

  React.useEffect(() => {
    setImgErr(false);
    setImgZoomed(false);
    setImgPan({ x: 0, y: 0 });
  }, [activeImg]);

  // Undo / redo keyboard shortcuts
  React.useEffect(() => {
    if (!article) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier) {
        return;
      }
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo(article.id);
      } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault();
        redo(article.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [article, undo, redo]);

  if (!article) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No article selected
      </div>
    );
  }

  const unsavedEdits = getUnsavedEditCount(article.id);
  const canUndo = getCanUndo(article.id);
  const canRedo = getCanRedo(article.id);
  const conf = confidenceTone(article.confidence);
  const editLog = getArticleEditLog(article.id);
  const pendingLog = editLog.filter((entry) => entry.status === 'pending');
  const isReadOnly = reviewStore.isSubmitted(article.id) || article.status === 'approved';
  const submission = reviewStore.getSubmission(article.id);

  const containsAllergens = article.allergens.filter((a) => a.level === 'contains');
  const mayContainAllergens = article.allergens.filter((a) => a.level === 'may_contain');
  const activeImage = images[activeImg] ?? images[0] ?? null;
  const offLink = `https://world.openfoodfacts.org/product/${article.barcode}`;

  const panFromXY = (clientX: number, clientY: number) => {
    const rect = imgContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const fracX = (clientX - rect.left) / rect.width;
    const fracY = (clientY - rect.top) / rect.height;
    const maxX = (rect.width * (ZOOM - 1)) / 2;
    const maxY = (rect.height * (ZOOM - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, maxX * (1 - 2 * fracX))),
      y: Math.max(-maxY, Math.min(maxY, maxY * (1 - 2 * fracY))),
    };
  };
  const onImgClick = (e: React.MouseEvent) => {
    if (!activeImage?.url) return;
    if (imgZoomed) {
      setImgZoomed(false);
      setImgPan({ x: 0, y: 0 });
    } else {
      setImgZoomed(true);
      setImgPan(panFromXY(e.clientX, e.clientY));
    }
  };
  const onImgMove = (e: React.MouseEvent) => {
    if (!imgZoomed) return;
    const cx = e.clientX;
    const cy = e.clientY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setImgPan(panFromXY(cx, cy)));
  };

  const openSubmit = () => {
    if (unsavedEdits > 0) {
      saveChanges(article.id);
    }
    setShowSubmit(true);
    setTimeout(() => {
      submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  const onSubmit = () => {
    submitArticle(article.id, comment.trim());
    navigate(ROUTES.submitted);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-card border-l border-border">
      {/* Top meta bar — name, confidence, barcode, scanned / updated, undo/redo */}
      <div
        className="flex items-center gap-2.5 px-5 py-2.5 flex-shrink-0 min-h-12 bg-card flex-wrap"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <span className="text-[14px] font-bold truncate" style={{ color: C.fg, letterSpacing: '-0.01em' }}>
          {article.name}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0"
          style={{ color: conf.color, backgroundColor: conf.bg, border: `1px solid ${conf.border}` }}
        >
          {article.confidence}% confidence
        </span>
        <MetaDivider />
        <span className="inline-flex items-center gap-1 shrink-0 text-[11.5px]" style={{ color: C.mutedFg }}>
          <span className="font-mono tabular-nums">Barcode: {article.barcode}</span>
          <CopyButton value={article.barcode} label="barcode" />
        </span>
        <MetaDivider />
        <span className="text-[11.5px] whitespace-nowrap shrink-0" style={{ color: C.mutedFg }}>
          Scanned {dateOnly(article.extractedAt)}
        </span>
        <MetaDivider />
        <span className="text-[11.5px] whitespace-nowrap shrink-0" style={{ color: C.mutedFg }}>
          Updated: {dateOnly(article.approvedAt ?? article.extractedAt)}
        </span>
        <div className="ml-auto flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => undo(article.id)}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => redo(article.id)}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body — details (scroll, left) + photo panel (full height, right) */}
      <div className="flex-1 flex flex-row-reverse min-h-0 overflow-hidden">
        {/* PHOTO PANEL — faithful port of the nutritionist photo panel */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: photoCollapsed ? 0 : '50%',
            borderLeft: photoCollapsed ? 'none' : `1px solid ${C.border}`,
            backgroundColor: '#fff',
            transition: 'width 0.25s ease',
          }}
        >
          {/* Main image — click to zoom in/out, move to pan while zoomed */}
          <div
            ref={imgContainerRef}
            onClick={onImgClick}
            onMouseMove={onImgMove}
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: C.muted,
              overflow: 'hidden',
              minHeight: 0,
              cursor: !activeImage?.url ? 'default' : imgZoomed ? 'zoom-out' : 'zoom-in',
            }}
          >
            {activeImage?.url && !imgErr ? (
              <img
                key={activeImage.url}
                src={activeImage.url}
                alt={activeImage.label}
                onError={() => setImgErr(true)}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                  transform: `translate3d(${imgPan.x}px, ${imgPan.y}px, 0) scale(${imgZoomed ? ZOOM : 1})`,
                  transformOrigin: 'center center',
                  transition: imgZoomed ? 'none' : 'transform 0.18s ease-out',
                  willChange: imgZoomed ? 'transform' : 'auto',
                  backfaceVisibility: 'hidden',
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 11, color: C.mutedFg }}>
                No image
              </div>
            )}

            {/* Collapse button — vertically centered, flush to left edge */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setPhotoCollapsed(true);
              }}
              title="Hide photos"
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%)',
                width: 22,
                height: 22,
                backgroundColor: 'rgba(15,23,42,0.28)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '0 6px 6px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s',
                zIndex: 5,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.55)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.28)')}
            >
              <ChevronRight size={10} style={{ color: 'rgba(255,255,255,0.75)' }} strokeWidth={2.5} />
            </button>

            {/* Floating dot indicators — bottom center */}
            {images.length > 1 ? (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 5,
                  alignItems: 'center',
                  padding: '5px 10px',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 999,
                }}
              >
                {images.map((img, i) => (
                  <button
                    key={img.ordinal}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImg(i);
                    }}
                    style={{
                      width: i === activeImg ? 18 : 6,
                      height: 6,
                      borderRadius: 999,
                      border: i === activeImg ? 'none' : '1px solid rgba(255,255,255,0.5)',
                      backgroundColor: i === activeImg ? '#fff' : 'rgba(255,255,255,0.3)',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'width 0.2s, background 0.15s',
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Thumbnail strip — Front / Back / Side / Barcode + OFF link */}
          <div
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2"
            style={{ backgroundColor: '#fff', borderTop: `1px solid ${C.border}` }}
          >
            {THUMB_LABELS.map((lbl, i) => {
              const isActive = activeImg === i;
              return (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: isActive ? `2.5px solid ${C.fg}` : `1.5px solid ${C.border}`,
                    backgroundColor: C.muted,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'border-color 0.12s, box-shadow 0.12s',
                    boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.12)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ width: '100%', height: '100%' }}>
                    <Thumb url={images[i]?.url} label={lbl} />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
                      color: '#fff',
                      fontSize: 8,
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '4px 0 3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {lbl}
                  </div>
                </button>
              );
            })}
            <a
              href={offLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: 'auto', fontSize: 9, color: C.mutedFg, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
              title="View on Open Food Facts"
            >
              📷 OFF
            </a>
          </div>
        </div>

        {/* DETAILS — scrollable dropdowns (unchanged content) */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto retina-thin-scroll min-w-0"
          style={{ backgroundColor: C.page }}
        >
          <div className="px-6 py-6 max-w-3xl mx-auto flex flex-col gap-4">
            {/* Read-only banner */}
            {isReadOnly ? (
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: C.prBg, border: `1px solid ${C.prBdr}`, color: C.am }}
              >
                {article.status === 'approved'
                  ? `Read-only — approved${article.approvedAt ? ` · ${article.approvedAt}` : ''}.`
                  : `Read-only — submitted${submission?.submittedAt ? ` · ${submission.submittedAt}` : ''}.`}
              </div>
            ) : null}

            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.fg, letterSpacing: '-0.02em' }}>
              {article.name}
            </h1>

            {/* INGREDIENTS — unchanged SME section */}
            <CollapsibleSection title="Ingredients" defaultOpen count={article.ingredients.length}>
              <IngredientsTable articleId={article.id} ingredients={article.ingredients} />
            </CollapsibleSection>

            {/* ALLERGENS (Contains) */}
            <AccordionCard title="Allergens (Contains)" defaultOpen>
              <p className="text-[11px] mb-2" style={{ color: C.mutedFg }}>
                Allergens definitely present on the packet label.
              </p>
              <div className="flex flex-wrap gap-2">
                {containsAllergens.length ? (
                  containsAllergens.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: C.rdBg, color: C.rd, border: `1px solid ${C.rdBdr}` }}
                    >
                      {a.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic" style={{ color: C.mutedFg }}>
                    None
                  </span>
                )}
              </div>
            </AccordionCard>

            {/* MAY CONTAIN */}
            <AccordionCard title="May Contain" defaultOpen>
              <p className="text-[11px] mb-2" style={{ color: C.mutedFg }}>
                Probable allergens — trace contamination from the same factory line.
              </p>
              <div className="flex flex-wrap gap-2">
                {mayContainAllergens.length ? (
                  mayContainAllergens.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: C.amBg, color: C.am, border: `1px solid ${C.amBdr}` }}
                    >
                      {a.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic" style={{ color: C.mutedFg }}>
                    None declared
                  </span>
                )}
              </div>
            </AccordionCard>

            {/* NUTRIENTS */}
            <AccordionCard title="Nutrients" defaultOpen>
              <div className="overflow-hidden" style={{ border: `1px solid ${C.border}`, borderRadius: 4 }}>
                <div className="flex" style={{ backgroundColor: C.page, borderBottom: `1px solid ${C.border}` }}>
                  <div
                    className="px-3 py-2.5"
                    style={{ flex: 1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.mutedFg }}
                  >
                    Nutrient Name
                  </div>
                  <div
                    className="px-3 py-2.5"
                    style={{ width: 150, flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.mutedFg, borderLeft: `1px solid ${C.border}`, textAlign: 'center' }}
                  >
                    Per 100g / 100ml
                  </div>
                  <div
                    className="px-3 py-2.5"
                    style={{ width: 64, flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.mutedFg, borderLeft: `1px solid ${C.border}` }}
                  >
                    UOM
                  </div>
                </div>
                {article.nutrition.map((row, idx, arr) => {
                  const isLast = idx === arr.length - 1;
                  return (
                    <div
                      key={row.id}
                      className="flex items-stretch"
                      style={{ borderBottom: isLast ? 'none' : `1px solid ${C.border}`, backgroundColor: '#fff' }}
                    >
                      <div className="px-3 py-2.5 flex items-center" style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.fg, lineHeight: 1.3 }}>{row.nutrient}</span>
                      </div>
                      <div
                        className="px-3 py-2.5 flex items-center justify-center"
                        style={{ width: 150, flexShrink: 0, borderLeft: `1px solid ${C.border}` }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.fg, fontFeatureSettings: '"tnum"' }}>
                          {row.extractedValue}
                        </span>
                      </div>
                      <div
                        className="px-3 py-2.5 flex items-center"
                        style={{ width: 64, flexShrink: 0, borderLeft: `1px solid ${C.border}` }}
                      >
                        <span style={{ fontSize: 12, color: C.mutedFg }}>{row.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionCard>

            {/* ACTIVITY */}
            <AccordionCard title="Activity" defaultOpen={editLog.length > 0}>
              {editLog.length === 0 ? (
                <p className="text-[12px] text-muted-foreground italic">No edits yet for this article.</p>
              ) : (
                <ol className="space-y-1.5">
                  {editLog.slice(0, 30).map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2 text-[12px]">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full border shrink-0 ${
                          entry.status === 'pending' ? 'border-amber-500' : 'border-emerald-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-foreground/90">
                          <span className="font-medium text-foreground">{entry.editedBy}</span>{' '}
                          <span className="text-muted-foreground">{describeEdit(entry)}</span>
                        </p>
                        <p className="text-[10.5px] text-muted-foreground/70 mt-0.5">{entry.editedAt}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </AccordionCard>

            {/* Submit panel — appears after Save */}
            {showSubmit ? (
              <section
                ref={submitRef}
                className="rounded-lg p-4"
                style={{ border: `1px solid ${C.prBdr}`, backgroundColor: C.card }}
                aria-live="polite"
              >
                <h2 className="text-[13px] font-semibold text-foreground">Submit for review</h2>
                {pendingLog.length > 0 ? (
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">
                    {pendingLog.length} edit{pendingLog.length === 1 ? '' : 's'} will be sent.
                  </p>
                ) : null}
                <label className="block mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Comment <span className="text-muted-foreground/70 normal-case">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Briefly explain your decisions (what you changed, what you verified, anything reviewers should know)…"
                  rows={3}
                  autoFocus
                  className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/70"
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmit(false)}
                    className="px-3 h-8 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold hover:bg-primary-hover"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Submit
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {/* Collapsed-photo expand tab — fixed to the right edge */}
      {photoCollapsed ? (
        <button
          type="button"
          onClick={() => setPhotoCollapsed(false)}
          title="Show photos"
          style={{
            position: 'fixed',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            backgroundColor: C.pr,
            color: '#fff',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '5px 9px',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.03em',
            boxShadow: '-2px 0 8px rgba(24,95,165,0.25)',
            zIndex: 20,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.prHov)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.pr)}
        >
          <Camera size={12} /> Photos
        </button>
      ) : null}

      {/* Bottom action footer — helper text left, actions right */}
      {!showSubmit ? (
        <div className="flex-shrink-0 border-t border-border bg-card px-5 py-3 flex items-center gap-3">
          {isReadOnly ? (
            <>
              <span className="text-[11.5px]" style={{ color: C.mutedFg }}>
                This article is locked.
              </span>
              <span className="ml-auto text-[12px] text-muted-foreground inline-flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${article.status === 'approved' ? 'bg-sky-500' : 'bg-stone-400'}`}
                />
                {article.status === 'approved'
                  ? `Approved · ${article.approvedAt ?? ''}`
                  : `Submitted · ${submission?.submittedAt ?? ''}`}
                <span className="text-muted-foreground/70 ml-1">read only</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-[11.5px]" style={{ color: C.mutedFg }}>
                {unsavedEdits > 0
                  ? `${unsavedEdits} unsaved edit${unsavedEdits === 1 ? '' : 's'} — save to continue.`
                  : 'Submitting will send this article for review.'}
              </span>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {unsavedEdits === 0
                  ? (() => {
                      const currentBucket: 'high' | 'amber' | 'low' =
                        article.confidence >= 90 ? 'high' : article.confidence >= 80 ? 'amber' : 'low';
                      const BUCKETS: { key: 'high' | 'amber' | 'low'; label: string; dot: string; sub: string }[] = [
                        { key: 'high', label: 'Match', dot: 'bg-emerald-500', sub: 'High confidence (95%)' },
                        { key: 'amber', label: 'Review', dot: 'bg-amber-500', sub: 'Needs a second look (85%)' },
                        { key: 'low', label: 'Fix', dot: 'bg-rose-500', sub: 'Low confidence — rework (50%)' },
                      ];
                      const targets = BUCKETS.filter((b) => b.key !== currentBucket);
                      return (
                        <div className="relative" ref={moveRef}>
                          <button
                            type="button"
                            onClick={() => setMoveOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-[12.5px] font-medium transition-colors ${
                              moveOpen
                                ? 'border-primary/40 bg-primary/10 text-foreground'
                                : 'border-border bg-card text-foreground hover:bg-muted hover:border-foreground/20'
                            }`}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Move to…
                          </button>
                          {moveOpen ? (
                            <div className="absolute right-0 bottom-[calc(100%+6px)] w-64 rounded-lg border border-border bg-card shadow-soft z-50 overflow-hidden">
                              <div className="px-3 py-2 border-b border-border/70">
                                <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
                                  Move to bucket
                                </p>
                                <p className="text-[11.5px] text-muted-foreground/80 mt-0.5">
                                  Currently in {BUCKETS.find((b) => b.key === currentBucket)?.label}
                                </p>
                              </div>
                              <div className="p-1">
                                {targets.map((t) => (
                                  <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => {
                                      moveToBucket(article.id, t.key);
                                      setMoveOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left hover:bg-muted/40 transition-colors"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${t.dot} shrink-0`} />
                                    <span className="flex-1 min-w-0">
                                      <span className="block text-[13px] font-medium text-foreground">{t.label}</span>
                                      <span className="block text-[11.5px] text-muted-foreground truncate">{t.sub}</span>
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })()
                  : null}
                <button
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                  onClick={openSubmit}
                >
                  {unsavedEdits > 0 ? 'Save changes' : 'Submit for review'}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function describeEdit(entry: import('../data/mockData').EditLogEntry): string {
  const field = entry.field;
  if (field === 'ingredient.add') {
    return `added ingredient "${entry.newValue}"`;
  }
  if (field === 'ingredient.delete') {
    return `removed ingredient "${entry.oldValue}"`;
  }
  if (field === 'allergen.summary') {
    return `updated allergens to "${entry.newValue}"`;
  }
  if (field === 'submission') {
    return entry.newValue.startsWith('submitted')
      ? `submitted the article${entry.newValue.startsWith('submitted — ') ? ` — "${entry.newValue.slice('submitted — '.length)}"` : ''}`
      : `set status to ${entry.newValue}`;
  }
  if (field === 'decision' || field === 'status' || field === 'approval') {
    return `set ${field} from "${entry.oldValue}" to "${entry.newValue}"`;
  }
  return `changed ${field} from "${entry.oldValue}" to "${entry.newValue}"`;
}
