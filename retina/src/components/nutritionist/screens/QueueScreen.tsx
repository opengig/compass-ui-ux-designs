// @ts-nocheck
import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Filter, ChevronLeft, ChevronRight, Check, X, RefreshCcw,
} from "lucide-react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, Checkbox } from "../components/ui";
import { C, T } from "../data/tokens";
import { ARTS } from "../data/mockData";
import { PageHeader, IssueChips } from "../components/shared";
import { BtnSecondary } from "../components/buttons";
import { EditIngredientsPanel } from "../components/EditIngredientsPanel";
import { NUTRITIONIST_ROUTES } from "../../../router/routes";
import { useNutritionist } from "../NutritionistContext";

/** Task queue with status tabs, filters, infinite scroll, and inline edit panel. */

export function QueueScreen() {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const ctx = useNutritionist();
  const { selectedSites, queueTab, setQueueTab, highlightArtIds, setHighlightArtIds, setNavIds } = ctx;
  const initialArtId = articleId ? Number(articleId) : null;
  const clearQueueArtId = () => navigate(NUTRITIONIST_ROUTES.queue, { replace: true });
  const openArt = (id, ro, ids) => {
    if (ids) setNavIds(ids);
    navigate(`/nutritionist/article/${id}`, { state: { viewOnly: !!ro, backTarget: "queue" } });
  };
  const [qIssues, setQIssues] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCat, setFilterCat] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [selectedArticles, setSelectedArticles] = useState(new Set())
  const [panelPos, setPanelPos] = useState({top:0,left:0})
  const [visibleCount, setVisibleCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [editPanelArtId, setEditPanelArtId] = useState(initialArtId ?? ARTS[0]?.id ?? null)
  const [panelWidth, setPanelWidth] = useState(70)
  const [listWidth, setListWidth] = useState(280)
  const filterBtnRef = useRef(null)
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const sentinelRef = useRef(null)

  // When arriving from dashboard with a pre-selected article, open it and clear the flag
  useState(() => {
    if(initialArtId) { setEditPanelArtId(initialArtId); clearQueueArtId?.() }
  })

  // Scroll to first highlighted article when navigating from Incremental Article
  React.useEffect(() => {
    if(highlightArtIds.length > 0) {
      setTimeout(() => {
        const firstId = highlightArtIds[0]
        const el = document.querySelector(`[data-art-id="${firstId}"]`)
        if(el) el.scrollIntoView({ behavior:"smooth", block:"center" })
      }, 150)
    }
  }, [highlightArtIds])

  /* ── Drag-to-resize logic (right edit panel) ── */
  const startDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
    const containerW = containerRef.current?.offsetWidth || window.innerWidth

    const onMove = (mv) => {
      const dx = startX - mv.clientX          // dragging left = panel grows
      const newPct = Math.min(75, Math.max(25, startW + (dx / containerW) * 100))
      setPanelWidth(newPct)
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  /* ── Drag-to-resize logic (left article list) ── */
  const startListDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = listWidth
    const onMove = (mv) => {
      const dx = mv.clientX - startX
      setListWidth(Math.min(520, Math.max(180, startW + dx)))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  // Reset visible count whenever tab or filters change
  const qf = queueTab
  const setQf = (v) => { setQueueTab(v); setVisibleCount(10) }
  const setFilterCatR = (v) => { setFilterCat(v); setVisibleCount(10) }
  const toggleIssue = (k) => { setQIssues(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev,k]); setVisibleCount(10) }

  const siteFilteredArts = ARTS.filter(a => selectedSites.includes(a.site))
  const STATUS_TABS = [
    {key:"all",  label:"All Articles",    count: siteFilteredArts.length},
    {key:"green",label:"High confidence", count: siteFilteredArts.filter(a=>a.status==="green").length},
    {key:"amber",label:"Need review",     count: siteFilteredArts.filter(a=>a.status==="amber").length},
    {key:"red",  label:"Low confidence",  count: siteFilteredArts.filter(a=>a.status==="red").length},
    {key:"sme",  label:"From Article SME",count: siteFilteredArts.filter(a=>a.sme===true).length},
  ]
  const ISSUE_DEFS = [
    {key:"allergen",label:"Allergen",cls:"bg-[#FCEAEA] text-[#C53030] border-[#EFA0A0]"},
    {key:"nutrition",label:"Nutrition",cls:"bg-[#FEF9EE] text-[#7A5310] border-[#E8C97A]"},
    {key:"maycontain",label:"May Contain",cls:"bg-[#E6EEF3] text-[#1E5C7F] border-[#8BB8D4]"},
  ]

  const activeFilters = (filterCat && filterCat!=="all" ? 1 : 0) + qIssues.length + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0)

  let list = ARTS.filter(a => selectedSites.includes(a.site)).filter(a => {
    if(qf==="green") return a.status==="green"
    if(qf==="amber") return a.status==="amber"
    if(qf==="red")   return a.status==="red"
    if(qf==="sme")   return a.sme===true
    return true
  })
  if(filterCat && filterCat!=="all") list = list.filter(a=>a.cat===filterCat)
  if(qIssues.length) list = list.filter(a=>qIssues.some(iss=>{
    if(iss==="allergen")   return a.def_al?.length || a.prob_al?.length
    if(iss==="nutrition")  return Object.values(a.nuts||{}).some(n=>n.c==="missing")
    if(iss==="maycontain") return a.prob_al?.length
    return false
  }))

  const visibleList = list.slice(0, visibleCount)

  // Infinite scroll: observe sentinel, load more after 2s delay
  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && visibleCount < list.length) {
        setIsLoadingMore(true)
        setTimeout(() => {
          setVisibleCount(c => c + 10)
          setIsLoadingMore(false)
        }, 1000)
      }
    }, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLoadingMore, visibleCount, list.length])

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{backgroundColor:C.page}}>
      <PageHeader title="My Tasks"/>
      {/* Status tab bar + filter btn */}
      <div className="flex-shrink-0 flex items-center px-5" style={{backgroundColor:C.card, borderBottom:`1px solid ${C.border}`}}>
        {/* Underline tabs */}
        <div className="flex items-end gap-0 flex-1">
          {STATUS_TABS.map(t => {
            const on = qf === t.key
            const badgeCfg = {
              all:   {bg:C.prBg,    color:C.pr},
              green: {bg:C.grBg,    color:C.gr},
              amber: {bg:C.warnBg,  color:C.am},
              red:   {bg:C.rdBg,    color:C.rd},
              sme:   {bg:C.infoBg,  color:C.info},
            }
            const badge = badgeCfg[t.key] || badgeCfg.all
            const allChecked = list.length > 0 && list.every(a => selectedArticles.has(a.id))
            const someChecked = list.some(a => selectedArticles.has(a.id)) && !allChecked
            return (
              <button key={t.key}
                onClick={()=>setQf(qf===t.key&&t.key!=="all"?"all":t.key)}
                className="flex items-center gap-1.5 px-3 pt-3 pb-2.5 transition-colors whitespace-nowrap"
                style={{
                  fontSize:13, fontWeight: on ? 700 : 400,
                  color: on ? C.pr : C.mutedFg,
                  borderBottom: on ? `2.5px solid ${C.pr}` : "2.5px solid transparent",
                }}>
                {t.key === "all" && (
                  <span
                    onClick={e => {
                      e.stopPropagation()
                      if (allChecked) {
                        setSelectedArticles(prev => { const next = new Set(prev); list.forEach(a => next.delete(a.id)); return next })
                      } else {
                        setSelectedArticles(prev => { const next = new Set(prev); list.forEach(a => next.add(a.id)); return next })
                      }
                    }}
                    style={{
                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                      width:14, height:14, borderRadius:3, flexShrink:0,
                      border:`1.5px solid ${allChecked || someChecked ? C.pr : C.border}`,
                      backgroundColor: allChecked ? C.pr : "transparent",
                      cursor:"pointer",
                    }}>
                    {allChecked && <Check size={9} color="#fff" strokeWidth={3}/>}
                    {someChecked && <span style={{width:6,height:2,borderRadius:1,backgroundColor:C.pr,display:"block"}}/>}
                  </span>
                )}
                {t.label}
                <span className="inline-flex items-center justify-center rounded-full font-bold"
                  style={{
                    fontSize:10, minWidth:18, height:18, padding:"0 5px",
                    backgroundColor:badge.bg, color:badge.color,
                  }}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
        {/* Filter button — right aligned, vertically centred */}
        <div className="relative flex-shrink-0">
          <div className="relative inline-flex">
            <BtnSecondary
              className={activeFilters>0?"border-[#E8C97A] text-[#C68A1E] bg-[#FEF9EE]":""}
              style={{borderRadius:6, height:36, fontSize:12, fontWeight:600}}
              onClick={()=>{ setFilterOpen(o=>!o) }}>
              <Filter size={11}/>
              Filter
              {activeFilters>0 && <span className="inline-flex items-center justify-center rounded-full bg-white text-[#C68A1E] text-[10px] font-bold" style={{minWidth:16,height:16,padding:"0 4px",border:`1px solid ${C.prBdr}`}}>{activeFilters}</span>}
            </BtnSecondary>
            {activeFilters>0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white" style={{backgroundColor:"#E53935", zIndex:1}}/>
            )}
          </div>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={()=>setFilterOpen(false)}/>
              <div className="absolute z-50 rounded-xl p-4 w-72"
                style={{top:"calc(100% + 8px)", right:0, backgroundColor:C.card,
                        border:`1px solid ${C.border3}`,
                        boxShadow:"0 8px 16px rgba(26,26,26,0.12)"}}>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.05em] text-[#8A8275] mb-2 block">Date Range</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-[#8A8275] mb-1 block">From</label>
                        <input type="date" value={filterDateFrom}
                          onChange={e=>{ setFilterDateFrom(e.target.value); setVisibleCount(10) }}
                          className="w-full h-9 rounded-md border border-[#ECE6DA] px-2 text-xs text-[#1A1A1A] bg-white outline-none focus:border-[#E8C97A] focus:ring-1 focus:ring-[#E8C97A]"
                          style={{fontFamily:"'Inter', sans-serif"}}/>
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-[#8A8275] mb-1 block">To</label>
                        <input type="date" value={filterDateTo}
                          onChange={e=>{ setFilterDateTo(e.target.value); setVisibleCount(10) }}
                          className="w-full h-9 rounded-md border border-[#ECE6DA] px-2 text-xs text-[#1A1A1A] bg-white outline-none focus:border-[#E8C97A] focus:ring-1 focus:ring-[#E8C97A]"
                          style={{fontFamily:"'Inter', sans-serif"}}/>
                      </div>
                    </div>
                    {(filterDateFrom || filterDateTo) && (
                      <button onClick={()=>{ setFilterDateFrom(""); setFilterDateTo(""); setVisibleCount(10) }}
                        className="mt-1.5 text-[10px] text-[#C68A1E] underline underline-offset-2 hover:opacity-70 transition-opacity">
                        Clear dates
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.05em] text-[#8A8275] mb-2 block">Category</label>
                    <Select value={filterCat} onValueChange={setFilterCatR}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All categories"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {["Staples","Dairy","Bakery","Confectionery"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.05em] text-[#8A8275] mb-2 block">Issue Type</label>
                    <div className="flex flex-wrap gap-2">
                      {ISSUE_DEFS.map(p=>{
                        const on = qIssues.includes(p.key)
                        return (
                          <button key={p.key} onClick={()=>toggleIssue(p.key)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${on?p.cls:"bg-[#ffffff] text-[#8A8275] border-[#ECE6DA] hover:bg-[#FBF9F5]"}`}>
                            {on && <X size={10}/>}{p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {activeFilters>0 && (
                    <BtnSecondary className="w-full justify-center" onClick={()=>{setFilterCat("all");setQIssues([]);setFilterDateFrom("");setFilterDateTo("")}}>
                      <RefreshCcw size={11}/>Clear all filters
                    </BtnSecondary>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main body: table + optional inline edit panel ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* ── TABLE COLUMN — resizable via drag handle ── */}
        <div className="flex flex-col overflow-hidden flex-shrink-0"
          style={{width:listWidth, minWidth:180, maxWidth:520, backgroundColor:C.page, position:"relative"}}>
          <div className="flex-1 overflow-y-auto">
            <div>
              <Card className="shadow-sm overflow-hidden rounded-none border-x-0 border-t-0" style={{borderRadius:0}}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <tbody>
                      {visibleList.length ? visibleList.map(a=>{
                        const isActive = a.id === editPanelArtId
                        const highlightIndex = highlightArtIds.indexOf(a.id)
                        const isHighlighted = highlightIndex !== -1
                        // Selected article row always uses brand amber for fill + rail.
                        // Status colour is still shown via the bullet/badge inside the row.
                        const selectorColor = C.pr
                        const selectorBg    = C.pr
                        return (
                          <tr key={a.id} data-art-id={a.id} className="cursor-pointer transition-colors"
                            style={{
                              borderBottom:`1px solid ${isHighlighted ? C.border3 : C.border}`,
                              backgroundColor: isActive ? selectorBg : "transparent",
                              borderLeft: `3px solid ${isActive ? selectorColor : "transparent"}`,
                              color: isActive ? "#fff" : undefined,
                              animation: isHighlighted ? `artGlow 2s ease-in-out 0s both` : "none",
                            }}
                            onClick={()=>setEditPanelArtId(a.id)}
                            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.backgroundColor=C.surfHov }}
                            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.backgroundColor="transparent" }}>
                            <td className="pl-3 pr-1 py-3" style={{width:28,verticalAlign:"middle"}}>
                              <span
                                onClick={e => {
                                  e.stopPropagation()
                                  setSelectedArticles(prev => {
                                    const next = new Set(prev)
                                    next.has(a.id) ? next.delete(a.id) : next.add(a.id)
                                    return next
                                  })
                                }}
                                style={{
                                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                                  width:14, height:14, borderRadius:3, flexShrink:0,
                                  border:`1.5px solid ${selectedArticles.has(a.id) ? C.pr : C.border}`,
                                  backgroundColor: selectedArticles.has(a.id) ? C.pr : "transparent",
                                  cursor:"pointer",
                                }}>
                                {selectedArticles.has(a.id) && <Check size={9} color="#fff" strokeWidth={3}/>}
                              </span>
                            </td>
                            <td className="pr-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p style={{...T.tableNm, fontSize: editPanelArtId?12:13, color: isActive ? "#fff" : T.tableNm.color}}>{a.name}</p>
                                {a.sme && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border flex-shrink-0"
                                    style={{fontSize:9,fontWeight:700,letterSpacing:"0.03em",
                                            backgroundColor:isActive?"#fff":C.prBg,color:C.pr,borderColor:isActive?"#fff":C.prBdr,
                                            textTransform:"uppercase"}}>
                                    SME Updated
                                  </span>
                                )}
                              </div>
                              <p style={{...T.tableApl, color: isActive ? "rgba(255,255,255,0.85)" : T.tableApl.color}}>{a.apl}</p>
                            </td>
                            {!editPanelArtId && <td className="px-4 py-3"><IssueChips art={a}/></td>}
                          </tr>
                        )
                      }) : (
                        <tr><td colSpan={2} className="text-center py-16">
                          <div className="flex flex-col items-center gap-2">
                            {selectedSites.length === 0 ? (
                              <>
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{opacity:0.35}}>
                                  <rect x="4" y="8" width="24" height="18" rx="3" stroke={C.mutedFg} strokeWidth="1.5" fill="none"/>
                                  <path d="M4 13h24" stroke={C.mutedFg} strokeWidth="1.5"/>
                                  <circle cx="24" cy="24" r="7" fill={C.page} stroke={C.mutedFg} strokeWidth="1.5"/>
                                  <path d="M21.5 24h5M24 21.5v5" stroke={C.mutedFg} strokeWidth="1.5" strokeLinecap="round" transform="rotate(45 24 24)"/>
                                </svg>
                                <p style={{fontSize:13,color:C.mutedFg,fontWeight:500}}>There are no articles to review</p>
                                <p style={{fontSize:11,color:C.ink4}}>Select a site to load articles</p>
                              </>
                            ) : (
                              <p style={{fontSize:13,color:C.mutedFg,fontWeight:500}}>No articles match this filter.</p>
                            )}
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
              {/* Infinite scroll sentinel + loader */}
              <div ref={sentinelRef} style={{height:1}}/>
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 py-5" style={{borderTop:`1px solid ${C.border}`}}>
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{animation:"spin 0.8s linear infinite"}}>
                    <circle cx="9" cy="9" r="7" fill="none" stroke={C.border} strokeWidth="2.5"/>
                    <path d="M9 2 A7 7 0 0 1 16 9" fill="none" stroke={C.pr} strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{fontSize:12,color:C.mutedFg,fontWeight:500}}>Loading more articles…</span>
                </div>
              )}
              {!isLoadingMore && visibleCount >= list.length && list.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <span style={{fontSize:11,color:C.mutedFg}}>All {list.length} articles loaded</span>
                </div>
              )}
            </div>
          </div>
          {/* ── List resize handle (right edge) ── */}
          <div
            onMouseDown={startListDrag}
            style={{
              position:"absolute", top:0, right:0, width:5, height:"100%",
              cursor:"col-resize", zIndex:10,
              backgroundColor:"transparent",
              borderRight:`1px solid ${C.border}`,
              transition:"background-color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.backgroundColor=C.prBg;e.currentTarget.style.borderRightColor=C.pr}}
            onMouseLeave={e=>{e.currentTarget.style.backgroundColor="transparent";e.currentTarget.style.borderRightColor=C.border}}
          />
        </div>

        {/* ── INLINE EDIT PANEL — shown beside table, not as overlay ── */}
        {selectedSites.length === 0 ? (
          <div className="flex flex-1 items-center justify-center overflow-hidden"
            style={{borderLeft:`1px solid ${C.border}`, backgroundColor:C.page}}>
            <div className="flex flex-col items-center gap-3" style={{opacity:0.7}}>
              {/* Subtle document + cursor illustration */}
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="8" width="32" height="40" rx="4" stroke={C.border3} strokeWidth="1.5" fill={C.muted}/>
                <path d="M19 20h18M19 27h18M19 34h11" stroke={C.border3} strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="46" cy="46" r="10" fill={C.page} stroke={C.border2} strokeWidth="1.5"/>
                <path d="M42 46h8M46 42v8" stroke={C.ink4} strokeWidth="1.5" strokeLinecap="round" transform="rotate(45 46 46)"/>
              </svg>
              <p style={{fontSize:13,fontWeight:500,color:C.mutedFg,textAlign:"center"}}>No article selected</p>
              <p style={{fontSize:11,color:C.ink4,textAlign:"center",maxWidth:160,lineHeight:1.5}}>Select a site to load articles for review</p>
            </div>
          </div>
        ) : editPanelArtId ? (() => {
          const panelArt = ARTS.find(a=>a.id===editPanelArtId)
          if(!panelArt) return null
          return (
            <div className="flex flex-1 overflow-hidden"
              style={{
                minWidth:400,
                borderLeft:`1px solid ${C.border}`,
              }}>
              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                <EditIngredientsPanel key={panelArt.id} art={panelArt} onClose={()=>setEditPanelArtId(ARTS[0]?.id ?? null)}/>
              </div>
            </div>
          )
        })() : null}

      </div>
    </div>
  )
}
