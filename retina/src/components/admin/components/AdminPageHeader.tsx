import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ title, subtitle, backTo, action }: Props) {
  return (
    <header className="flex-shrink-0 h-12 bg-card border-b border-border flex items-center gap-3 px-4">
      {backTo ? (
        <Link
          to={backTo}
          aria-label="Back"
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1 flex items-baseline gap-2">
        <h1 className="text-[15px] font-semibold text-foreground tracking-tight truncate">{title}</h1>
        {subtitle ? <p className="text-[12px] text-muted-foreground truncate">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function AdminToast({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: 'success' | 'error';
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const t = window.setTimeout(onDismiss, 2400);
    return () => window.clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      className={`fixed bottom-5 right-5 z-[300] flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold shadow-lg ${
        variant === 'success'
          ? 'bg-foreground text-background'
          : 'bg-destructive text-destructive-foreground'
      }`}
      role="status"
    >
      {variant === 'success' ? (
        <Check size={14} className="text-emerald-400" />
      ) : (
        <AlertCircle size={14} className="text-destructive-foreground/90" />
      )}
      {message}
    </div>
  );
}
