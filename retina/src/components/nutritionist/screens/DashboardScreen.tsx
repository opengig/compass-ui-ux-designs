// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { ChevronRight, AlertTriangle, Sparkles, ClipboardCheck } from "lucide-react";
import { C, T } from "../data/tokens";
import { ARTS } from "../data/mockData";
import { useNutritionist } from "../NutritionistContext";

/**
 * Dashboard screen — simplified per 26 May review.
 *
 * Why: nutritionist persona is not a chart consumer. She wants to know
 * "what needs my attention today?" — so the dashboard is reduced to a few
 * actionable counts and a prominent jump-into-queue panel. No graphs.
 */

export function DashboardScreen() {
  const navigate = useNavigate();
  const { selectedSites, setQueueTab, setHighlightArtIds } = useNutritionist();
  const goApp = (s) => navigate(`/nutritionist/${s}`);
  const siteArts = ARTS.filter(a => selectedSites.includes(a.site))

  const amberCount = siteArts.filter(a=>a.status==="amber").length
  const redCount   = siteArts.filter(a=>a.status==="red").length
  const greenCount = siteArts.filter(a=>a.status==="green").length
  const smeCount   = siteArts.filter(a=>a.sme===true).length
  const pendingTotal = amberCount + redCount

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{backgroundColor:C.page}}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 flex items-center justify-between" style={{height:72, backgroundColor:C.page, borderBottom:`1px solid ${C.border}`}}>
        <div>
          <h1 style={{fontSize:16, fontWeight:600, color:C.ink2, letterSpacing:"-0.01em", lineHeight:1.2}}>
            Welcome back, Priya
          </h1>
          <p style={{fontSize:11, fontWeight:400, color:C.mutedFg, marginTop:2}}>
            {new Date().toLocaleDateString("en-IN", {weekday:"long", day:"numeric", month:"long"})}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">

          {/* PRIMARY action card — Needs Attention (largest, top) */}
          <button
            onClick={()=>{ setQueueTab("amber"); goApp("queue") }}
            className="text-left"
            style={{
              backgroundColor:"#FEF3E0",
              border:`1px solid #E8C97A`,
              borderLeft:`6px solid ${C.pr}`,
              borderRadius:10,
              padding:"22px 24px",
              display:"flex", alignItems:"center", gap:18,
              cursor:"pointer", transition:"background-color 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor="#FDE8C0"}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor="#FEF3E0"}>
            <div style={{
              width:56, height:56, borderRadius:"50%",
              backgroundColor:"#fff", border:`1.5px solid ${C.amBdr}`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              <AlertTriangle size={26} color={C.pr} strokeWidth={2}/>
            </div>
            <div className="flex-1">
              <p style={{fontSize:10,fontWeight:700,color:C.am,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:4}}>Needs your attention</p>
              <p style={{fontSize:22,fontWeight:700,color:C.ink2,lineHeight:1.2,marginBottom:4}}>
                {pendingTotal} {pendingTotal === 1 ? "article" : "articles"} pending review
              </p>
              <p style={{fontSize:13,color:C.mutedFg,lineHeight:1.5}}>
                {amberCount} need review · {redCount} need fix
              </p>
            </div>
            <ChevronRight size={20} style={{color:C.am,flexShrink:0}}/>
          </button>

          {/* SME updates */}
          {smeCount > 0 && (
            <button
              onClick={()=>{ setQueueTab("sme"); goApp("queue") }}
              className="text-left"
              style={{
                backgroundColor:"#EEF2FF",
                border:`1px solid #C7D2FE`,
                borderLeft:`6px solid #4F46E5`,
                borderRadius:10,
                padding:"18px 22px",
                display:"flex", alignItems:"center", gap:16,
                cursor:"pointer", transition:"background-color 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor="#E0E7FF"}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="#EEF2FF"}>
              <div style={{
                width:44, height:44, borderRadius:"50%",
                backgroundColor:"#fff", border:`1.5px solid #C7D2FE`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                <Sparkles size={20} color="#4F46E5" strokeWidth={2}/>
              </div>
              <div className="flex-1">
                <p style={{fontSize:10,fontWeight:700,color:"#3730A3",textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:3}}>From SME</p>
                <p style={{fontSize:15,fontWeight:600,color:C.ink2,lineHeight:1.4}}>
                  {smeCount} {smeCount === 1 ? "article was" : "articles were"} updated by Article SME
                </p>
              </div>
              <ChevronRight size={18} style={{color:"#4F46E5",flexShrink:0}}/>
            </button>
          )}

          {/* Summary snapshot — simple counts, no charts */}
          <div>
            <p style={{...T.label, color:C.mutedFg, fontSize:10, marginBottom:8}}>Summary</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {label:"Pending Reviews", val:String(amberCount + redCount), sub:"Awaiting your review",  color:C.fg, accent:C.pr},
                {label:"Approved Items",  val:String(greenCount),            sub:"Ready to Cookbook",     color:C.fg, accent:C.gr},
                {label:"Reviewed Items",  val:String(siteArts.length),       sub:"Total profiles reviewed", color:C.fg, accent:C.info},
              ].map(m => (
                <div key={m.label}
                  style={{
                    backgroundColor:C.card, borderRadius:8, padding:"16px 14px",
                    border:`1px solid ${C.border}`, borderLeft:`3px solid ${m.accent}`,
                    boxShadow:"0 1px 2px rgba(26,26,26,0.04)",
                  }}>
                  <p style={{...T.kpiLabel, fontSize:10, marginBottom:6}}>{m.label}</p>
                  <p style={{fontSize:24,fontWeight:700,color:m.color,lineHeight:1.1,letterSpacing:"-0.02em",fontFeatureSettings:'"tnum"',marginBottom:4}}>{m.val}</p>
                  <p style={{fontSize:11, color:C.mutedFg}}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick jump — Approved */}
          <button
            onClick={()=>goApp("approved")}
            className="text-left"
            style={{
              backgroundColor:C.card,
              border:`1px solid ${C.border}`,
              borderRadius:10,
              padding:"14px 18px",
              display:"flex", alignItems:"center", gap:14,
              cursor:"pointer", transition:"background-color 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.card}>
            <div style={{
              width:36, height:36, borderRadius:8,
              backgroundColor:C.grBg, border:`1px solid ${C.grBdr}`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              <ClipboardCheck size={16} color={C.gr} strokeWidth={2}/>
            </div>
            <div className="flex-1">
              <p style={{fontSize:13,fontWeight:600,color:C.fg,lineHeight:1.3}}>
                Recently submitted
              </p>
              <p style={{fontSize:11,color:C.mutedFg,marginTop:2}}>
                View articles pushed to Cookbook
              </p>
            </div>
            <ChevronRight size={16} style={{color:C.mutedFg,flexShrink:0}}/>
          </button>

        </div>
      </div>
    </div>
  )
}
