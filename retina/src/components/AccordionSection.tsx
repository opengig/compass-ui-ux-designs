import React from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionSectionProps = {
  title: string;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function AccordionSection({
  title,
  badge,
  headerRight,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <section className="border border-border rounded-lg shadow-soft bg-card">
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-1 min-w-0 flex items-center gap-2.5 hover:text-foreground/90 transition-colors text-left"
          aria-expanded={isOpen}
        >
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
          <span className="text-base font-semibold text-foreground truncate">{title}</span>
          {badge}
        </button>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>

      {isOpen ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  );
}
