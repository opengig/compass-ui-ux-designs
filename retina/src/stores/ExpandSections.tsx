import React from 'react';

type ExpandValue = {
  expandSignal: number;
  collapseSignal: number;
  isExpanded: boolean;
  toggle: () => void;
};

const ExpandContext = React.createContext<ExpandValue | null>(null);

export function ExpandProvider({ children }: { children: React.ReactNode }) {
  const [expandSignal, setExpandSignal] = React.useState(0);
  const [collapseSignal, setCollapseSignal] = React.useState(0);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggle = React.useCallback(() => {
    if (isExpanded) {
      setCollapseSignal((prev) => prev + 1);
      setIsExpanded(false);
    } else {
      setExpandSignal((prev) => prev + 1);
      setIsExpanded(true);
    }
  }, [isExpanded]);

  return (
    <ExpandContext.Provider value={{ expandSignal, collapseSignal, isExpanded, toggle }}>
      {children}
    </ExpandContext.Provider>
  );
}

export function useExpandSections() {
  const ctx = React.useContext(ExpandContext);
  if (!ctx) {
    return { expandSignal: 0, collapseSignal: 0, isExpanded: false, toggle: () => {} };
  }
  return ctx;
}
