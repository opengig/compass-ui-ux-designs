// @ts-nocheck
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ALL_SITES } from "./data/sites";

/**
 * Cross-screen state for the nutritionist flow.
 *
 * Pre-router, NutritionistApp held all of this in useState and passed it
 * down as props. Now that each screen is its own route, the state has to
 * live above the Outlet so route changes don't reset it.
 *
 * Shape:
 *   - selectedSites:    multi-site filter shared by Dashboard/Queue/Approved/Audit
 *   - queueTab:         which status tab the queue should open on
 *   - highlightArtIds:  temporary glow targets when navigating Queue from Dashboard cards
 *   - navIds:           prev/next list for the DetailScreen arrows
 *   - toast:            global toast message
 *   - isAuthed:         simple session flag (login redirects to /dashboard, others redirect to /login)
 */

const NutritionistCtx = createContext(null);

export function NutritionistProvider({ children }: { children: ReactNode }) {
  const [selectedSites, setSelectedSites] = useState([...ALL_SITES]);
  const [queueTab, setQueueTab] = useState("all");
  const [highlightArtIds, setHighlightArtIds] = useState([]);
  const [navIds, setNavIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const value = {
    selectedSites, setSelectedSites,
    queueTab, setQueueTab,
    highlightArtIds, setHighlightArtIds,
    navIds, setNavIds,
    toast, showToast,
    isAuthed, setIsAuthed,
  };

  return <NutritionistCtx.Provider value={value}>{children}</NutritionistCtx.Provider>;
}

export function useNutritionist() {
  const ctx = useContext(NutritionistCtx);
  if (!ctx) {
    throw new Error("useNutritionist must be used inside <NutritionistProvider>");
  }
  return ctx;
}
