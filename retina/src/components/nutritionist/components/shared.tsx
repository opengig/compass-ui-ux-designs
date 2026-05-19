// @ts-nocheck
import { Clock } from "lucide-react";
import { C, T } from "../data/tokens";
import { computeDisplayNuts } from "../data/nutrients";

/**
 * Shared visual atoms used across nutritionist screens.
 */

export function StatusBadge({ status, className="" }) {
  const cfg = {
    green:  {bg:C.grBg,   color:C.gr,      border:C.gr,      dot:C.gr,      label:"MATCHED"},
    amber:  {bg:C.warnBg, color:C.am,      border:C.pr,      dot:C.pr,      label:"LIKELY MATCH"},
    red:    {bg:C.rdBg,   color:C.rd,      border:C.rd,      dot:C.rd,      label:"NO MATCH"},
    blue:   {bg:C.infoBg, color:C.info,    border:C.info,    dot:C.info,    label:"FROM SME"},
    gray:   {bg:C.page,   color:C.mutedFg, border:C.border,  dot:C.mutedFg, label:"UNKNOWN"},
    purple: {bg:"#F0EDFA",color:"#5B21B6", border:"#C4B5FD", dot:"#7C3AED", label:"SKIPPED"},
  }
  const s = cfg[status] || cfg.gray
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}
      style={{
        backgroundColor:s.bg, color:s.color, border:`1px solid ${s.border}`,
        fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", lineHeight:1.4,
        padding:"4px 10px", borderRadius:12, height:22,
      }}>
      <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:s.dot,flexShrink:0}}/>
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

// DS §6: TopBar h48, --panel bg, 1px --line bottom, z100; title H2 18px 600; right: refresh timestamp

export function PageHeader({ title, subtitle }) {
  const now = new Date()
  const stamp = now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false})
    + " IST · " + now.toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"})
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-6"
      style={{height:48, backgroundColor:C.card, borderBottom:`1px solid ${C.border}`,
              zIndex:100, boxShadow:"0 1px 2px rgba(26,26,26,0.05)"}}>
      <div className="flex items-center gap-3">
        <h1 style={{...T.h2, margin:0}}>{title}</h1>
        {subtitle && <span style={{...T.small}}>{subtitle}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Clock size={12} style={{color:C.mutedFg}}/>
        <span style={{...T.mono, color:C.mutedFg}}>{stamp}</span>
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
