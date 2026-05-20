// @ts-nocheck
import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "../components/ui";
import { C } from "../data/tokens";
import { AUDIT_LOG } from "../data/mockData";
import { PageHeader } from "../components/shared";

/** Audit log screen — chronological list of all user actions. */

export function AuditScreen() {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")

  const TYPE_CFG = {
    approved:   {label:"Approved",             bg:C.grBg,    color:C.gr,      dot:C.gr},
    move_store: {label:"Moved to Store Mgr",   bg:"#E8EEF8", color:"#3B5FA0", dot:"#3B5FA0"},
    move_sme:   {label:"Moved to Article SME", bg:C.infoBg,  color:C.info,    dot:C.info},
    remark:     {label:"Remark Added",         bg:C.amBg,    color:C.am,      dot:C.am},
    edited:     {label:"Edited",               bg:C.muted,   color:C.mutedFg, dot:C.mutedFg},
  }

  const filtered = AUDIT_LOG.filter(e => {
    if(dateFrom && e.date !== "today" && dateFrom) return false
    if(dateTo) return true
    return true
  })

  const clearDates = () => { setDateFrom(""); setDateTo("") }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <PageHeader title="Audit Log"/>

      {/* Date range filter */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 bg-card border-b border-border">
        <span style={{fontSize:11,fontWeight:600,color:C.mutedFg,textTransform:"uppercase",letterSpacing:"0.05em",flexShrink:0}}>Date</span>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
          style={{height:28,padding:"0 6px",borderRadius:6,fontSize:11,
            border:`1px solid ${dateFrom?C.pr:C.border}`,
            backgroundColor:dateFrom?C.prBg:"#fff",
            color:C.fg,outline:"none",cursor:"pointer"}}/>
        <span style={{fontSize:10,color:C.mutedFg,flexShrink:0}}>→</span>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
          style={{height:28,padding:"0 6px",borderRadius:6,fontSize:11,
            border:`1px solid ${dateTo?C.pr:C.border}`,
            backgroundColor:dateTo?C.prBg:"#fff",
            color:C.fg,outline:"none",cursor:"pointer"}}/>
        {(dateFrom||dateTo) && (
          <button onClick={clearDates}
            style={{display:"flex",alignItems:"center",gap:3,padding:"0 7px",height:28,
                    borderRadius:6,fontSize:11,color:C.mutedFg,border:`1px solid ${C.border}`,
                    backgroundColor:"transparent",cursor:"pointer"}}>
            <X size={9}/>Clear
          </button>
        )}
        <span style={{marginLeft:"auto",fontSize:11,color:C.mutedFg,flexShrink:0}}>
          {filtered.length} action{filtered.length!==1?"s":""}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div>
          <Card className="shadow-none overflow-hidden rounded-none border-x-0 border-t-0">
            {filtered.map((e,i) => {
              const cfg = TYPE_CFG[e.type] || TYPE_CFG.edited
              return (
                <div key={i}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${
                    i<filtered.length-1 ? "border-b border-border/60" : ""
                  }`}>
                  <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-border"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="truncate text-[13px] font-normal text-foreground leading-snug">{e.detail}</p>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap tabular-nums">{e.time}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{backgroundColor:cfg.bg,color:cfg.color}}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      </div>
    </div>
  )
}
