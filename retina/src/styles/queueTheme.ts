export const queueTheme = {
  appShell: 'bg-background',
  queueCanvas: 'bg-background',
  header: 'bg-background border-b border-border',
  headerActiveTab:
    'bg-accent text-foreground',
  headerIdleTab:
    'text-muted-foreground hover:bg-accent hover:text-foreground',
  headerCountActive: 'bg-primary/15 text-brand-ink',
  headerCountIdle: 'bg-muted text-muted-foreground',
  headerInput: 'border border-border bg-muted/60 placeholder:text-muted-foreground',
  headerFilterButton:
    'border border-border bg-background text-foreground hover:bg-accent',
  selectedRow: 'bg-muted',
  rowHover: 'hover:bg-accent',
  rightPanel: 'border-l border-border bg-muted',
  ctaButton:
    'border border-primary bg-primary text-primary-foreground hover:bg-primary-hover',
} as const;
