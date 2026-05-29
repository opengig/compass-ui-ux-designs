// @ts-nocheck
import { Clock } from "lucide-react";
import { C, T } from "../data/tokens";
import { computeDisplayNuts } from "../data/nutrients";

/**
 * Shared visual atoms used across nutritionist screens.
 */

export function StatusBadge({ status, className="" }) {
  // Status colors avoid red/green pair (veg/non-veg connotation per 26 May review).
  const cfg = {
    green:  { cls: "bg-teal-50 text-teal-700 border-teal-200",          dot: "bg-teal-500",    label: "READY TO COOKBOOK" },
    amber:  { cls: "bg-slate-100 text-slate-700 border-slate-200",      dot: "bg-slate-500",   label: "TO REVIEW" },
    red:    { cls: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400",    label: "TO FIX" },
    blue:   { cls: "bg-indigo-50 text-indigo-700 border-indigo-200",    dot: "bg-indigo-500",  label: "FROM SME" },
    gray:   { cls: "bg-muted text-muted-foreground border-border",      dot: "bg-muted-foreground", label: "UNKNOWN" },
    purple: { cls: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", dot: "bg-fuchsia-500", label: "SKIPPED" },
  }
  const s = cfg[status] || cfg.gray
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap h-[22px] px-2.5 rounded-full border text-[11px] font-semibold uppercase tracking-[0.1em] leading-[1.4] ${s.cls} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}


export function ConfBar({ value, showNum=true }) {
  const barColor = value>=80 ? C.gr : value>=50 ? C.am : C.rd
  const textColor = value>=80 ? C.gr : value>=50 ? C.am : C.rd
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden min-w-10" style={{backgroundColor:C.muted}}>
        <div className="h-full rounded-full" style={{width:`${value}%`,backgroundColor:barColor}}/>
      </div>
      {showNum && <span className="text-xs font-bold tabular-nums min-w-8 text-right" style={{color:textColor,fontSize:11,fontWeight:700}}>{value}%</span>}
    </div>
  )
}


export function NutBadge({ c }) {
  const cfg = {
    high:    {bg:C.grBg,   color:C.gr,      border:C.grBdr,  label:"Scanned"},
    mid:     {bg:C.grBg,   color:C.gr,      border:C.grBdr,  label:"Scanned"},
    missing: {bg:C.rdBg,   color:C.rd,      border:C.rdBdr,  label:"Missing"},
    llm:     {bg:C.warnBg, color:C.am,      border:C.prBdr,  label:"AI Est."},
    ai:      {bg:C.warnBg, color:C.am,      border:C.prBdr,  label:"AI Est."},
    na:      {bg:C.page,   color:C.mutedFg, border:C.border, label:"N/A"},
  }
  const s = cfg[c] || cfg.na
  return (
    <span className="inline-flex items-center px-2 py-0.5 whitespace-nowrap"
      style={{...T.badge, backgroundColor:s.bg, color:s.color, border:`1px solid ${s.border}`,
              borderRadius:9999, fontSize:11}}>
      {s.label}
    </span>
  )
}

export function PageHeader({ title, subtitle, divider=true, dense=false }) {
  const now = new Date()
  const stamp = now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false})
    + " IST · " + now.toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"})
  return (
    <div className={`flex-shrink-0 flex items-center justify-between ${dense ? "h-9" : "h-12"} pl-3 pr-6 bg-card z-[100] ${divider ? "border-b border-border" : ""}`}>
      <div className="flex items-center gap-3">
        <h1 className="m-0 text-[15px] font-semibold text-foreground">{title}</h1>
        {subtitle && <span className="text-[12px] text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Clock size={12} className="text-muted-foreground"/>
        <span className="font-mono text-[11.5px] text-muted-foreground">{stamp}</span>
      </div>
    </div>
  )
}


export function IssueChips({ art }) {
  const chips = []
  const dNuts = computeDisplayNuts(art)
  // Issue chips: outline + text only, no fill — keeps the row visually quiet.
  if(art.def_al?.length || art.prob_al?.length) chips.push(<span key="al" className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-transparent text-[#C53030] border border-[#C53030]">Allergen</span>)
  if(Object.values(dNuts||{}).some(n=>n.c==="missing")) chips.push(<span key="nu" className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-transparent text-[#7A5310] border border-[#7A5310]">Nutrition</span>)
  if(art.prob_al?.length) chips.push(<span key="mc" className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-transparent text-[#1E5C7F] border border-[#1E5C7F]">May Contain</span>)
  if(!chips.length) chips.push(<span key="ok" className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-transparent text-[#1B8754] border border-[#1B8754]">None</span>)
  return <div className="flex flex-wrap gap-1">{chips}</div>
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
