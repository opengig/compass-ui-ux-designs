// @ts-nocheck
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, CheckCircle2, BookOpen,
  ChevronLeft, ChevronRight, Building, Check,
} from "lucide-react";
import { C } from "../data/tokens";
import { ALL_SITES } from "../data/sites";
import { ARTS } from "../data/mockData";
import { COMPASS_LOGO } from "../data/images";
import { NUTRITIONIST_ROUTES } from "../../../router/routes";
import { useNutritionist } from "../NutritionistContext";

/**
 * Left-side icon nav rail for the nutritionist flow.
 *
 * Route-driven: highlights the active item from useLocation() and navigates
 * via useNavigate(). Site filter comes from NutritionistContext (shared
 * across every screen).
 */
export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSites, setSelectedSites } = useNutritionist();
  const [siteOpen, setSiteOpen] = useState(false)
  const pendingCount = ARTS.filter(a => selectedSites.includes(a.site)).length
  const NAV = [
    {key:"dashboard", label:"Dashboard", icon:<LayoutDashboard size={17}/>, path: NUTRITIONIST_ROUTES.dashboard },
    {key:"queue",     label:"Tasks",     icon:<ClipboardList size={17}/>,  badge: pendingCount > 0 ? pendingCount : null, path: NUTRITIONIST_ROUTES.queue },
    {key:"approved",  label:"Approved",  icon:<CheckCircle2 size={17}/>,                                                  path: NUTRITIONIST_ROUTES.approved },
    {key:"audit",     label:"Audit",     icon:<BookOpen size={17}/>,                                                       path: NUTRITIONIST_ROUTES.audit },
  ]
  const pathname = location.pathname
  const active =
    pathname.startsWith("/nutritionist/dashboard") ? "dashboard" :
    pathname.startsWith("/nutritionist/queue") ? "queue" :
    pathname.startsWith("/nutritionist/article") ? "queue" :
    pathname.startsWith("/nutritionist/approved") ? "approved" :
    pathname.startsWith("/nutritionist/audit") ? "audit" :
    "dashboard"
  const goApp = (item) => navigate(item.path)
  const toggleSite = (s) =>
    setSelectedSites(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])
  const allSelected = selectedSites.length === ALL_SITES.length
  const siteLabel = allSelected ? "All Sites" : selectedSites.length === 0 ? "No Sites" : selectedSites.length === 1 ? selectedSites[0] : `${selectedSites.length} Sites`

  /* single icon+label nav button */
  const NavBtn = ({item}) => {
    const isActive = active === item.key
    const [hov, setHov] = useState(false)
    return (
      <button
        key={item.key}
        onClick={() => goApp(item)}
        title={item.label}
        className="relative flex flex-col items-center justify-center w-full"
        style={{
          height: 64,
          border: "none",
          cursor: "pointer",
          backgroundColor: "transparent",
          gap: 3,
          transition: "background-color 0.15s",
        }}
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}>

        {/* Active indicator — thin left rail */}
        {isActive && (
          <div style={{
            position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
            width: 3, height: 28, borderRadius: "0 3px 3px 0",
            backgroundColor: C.pr,
          }}/>
        )}

        {/* icon pill */}
        <div className="relative flex items-center justify-center"
          style={{
            width: 40, height: 32, borderRadius: 8,
            backgroundColor: "transparent",
            transition: "background-color 0.15s",
          }}>
          <span style={{
            color: isActive ? C.pr : hov ? C.ink2 : C.mutedFg,
            transition: "color 0.15s",
            display:"flex",
          }}>
            {item.icon}
          </span>
          {/* badge */}
          {item.badge && (
            <span className="absolute flex items-center justify-center rounded-full"
              style={{
                top: -4, right: -5,
                minWidth: 17, height: 17,
                fontSize: 9, fontWeight: 600,
                backgroundColor: C.rdBg, color: C.rd,
                padding: "0 3px", lineHeight: 1,
              }}>
              {item.badge}
            </span>
          )}
        </div>

        {/* label */}
        <span style={{
          fontSize: 10,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? C.pr : hov ? C.ink2 : C.mutedFg,
          letterSpacing: "0.01em",
          lineHeight: 1,
          transition: "color 0.15s",
        }}>
          {item.label}
        </span>
      </button>
    )
  }

  return (
    <div className="flex-shrink-0 flex flex-col h-full"
      style={{width: 72, backgroundColor: C.card, borderRight: `1px solid ${C.border}`, overflow: "visible", position: "relative", zIndex: 100}}>

      {/* Logo */}
      <div className="flex items-center justify-center flex-shrink-0"
        style={{height: 72, borderBottom: `1px solid ${C.border}`, padding: "10px 8px"}}>
        <img
          src={COMPASS_LOGO}
          alt="Compass Group"
          style={{width: 44, height: 44, objectFit: "contain"}}
        />
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {NAV.map(item => <NavBtn key={item.key} item={item}/>)}
      </div>

      {/* Sites nav button */}
      <div className="flex-shrink-0 relative" style={{borderTop:`1px solid ${C.border}`}}>
        <button
          onClick={()=>setSiteOpen(o=>!o)}
          title={siteLabel}
          className="relative flex flex-col items-center justify-center w-full"
          style={{
            height: 64, border:"none", cursor:"pointer",
            backgroundColor: siteOpen ? C.surfHov : "transparent",
            gap:3, transition:"background-color 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.surfHov}
          onMouseLeave={e=>{ if(!siteOpen) e.currentTarget.style.backgroundColor="transparent" }}>
          {/* Active indicator — thin left rail when open */}
          {siteOpen && (
            <div style={{
              position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
              width:3, height:28, borderRadius:"0 3px 3px 0",
              backgroundColor: C.pr,
            }}/>
          )}
          {/* icon with badge */}
          <div className="relative flex items-center justify-center"
            style={{width:40, height:32, borderRadius:8}}>
            <Building size={17} style={{color: siteOpen || !allSelected ? C.pr : C.mutedFg, transition:"color 0.15s"}}/>
            {selectedSites.length > 0 && selectedSites.length < ALL_SITES.length && (
              <span className="absolute flex items-center justify-center rounded-full"
                style={{
                  top:-4, right:-5,
                  minWidth:17, height:17,
                  fontSize:9, fontWeight:700,
                  backgroundColor:C.pr, color:"#fff",
                  padding:"0 3px", lineHeight:1,
                }}>
                {selectedSites.length}
              </span>
            )}
          </div>
          <span style={{
            fontSize:10, fontWeight: siteOpen || !allSelected ? 600 : 400,
            color: siteOpen || !allSelected ? C.pr : C.mutedFg,
            letterSpacing:"0.01em", lineHeight:1, transition:"color 0.15s",
          }}>
            Sites
          </span>
        </button>

        {/* Site popover */}
        {siteOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={()=>setSiteOpen(false)}/>
            <div className="absolute z-50 rounded-xl p-2"
              style={{
                bottom: 0, left: "calc(100% + 8px)", width: 168,
                backgroundColor: C.card,
                border: `1px solid ${C.border3}`,
                boxShadow: "0 8px 24px rgba(26,26,26,0.13)",
              }}>
              <button
                onClick={()=> allSelected ? setSelectedSites([]) : setSelectedSites([...ALL_SITES])}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{fontSize:12,fontWeight:600,color:allSelected?C.am:C.fg,
                        backgroundColor:allSelected?C.prBg:"transparent",border:"none",cursor:"pointer"}}
                onMouseEnter={e=>{ if(!allSelected) e.currentTarget.style.backgroundColor=C.surfHov }}
                onMouseLeave={e=>{ if(!allSelected) e.currentTarget.style.backgroundColor="transparent" }}>
                <div style={{width:14,height:14,borderRadius:3,flexShrink:0,
                  border:`1.5px solid ${allSelected?C.pr:C.border}`,
                  backgroundColor:allSelected?C.pr:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {allSelected && <Check size={9} color="#fff" strokeWidth={3}/>}
                </div>
                All Sites
              </button>
              <div style={{height:1,backgroundColor:C.border,margin:"4px 8px"}}/>
              {ALL_SITES.map(s=>{
                const on = selectedSites.includes(s)
                return (
                  <button key={s} onClick={()=>toggleSite(s)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{fontSize:12,fontWeight:on?600:400,color:on?C.am:C.fg,
                            backgroundColor:on?C.prBg:"transparent",border:"none",cursor:"pointer"}}
                    onMouseEnter={e=>{ if(!on) e.currentTarget.style.backgroundColor=C.surfHov }}
                    onMouseLeave={e=>{ if(!on) e.currentTarget.style.backgroundColor="transparent" }}>
                    <div style={{width:14,height:14,borderRadius:3,flexShrink:0,
                      border:`1.5px solid ${on?C.pr:C.border}`,
                      backgroundColor:on?C.pr:"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {on && <Check size={9} color="#fff" strokeWidth={3}/>}
                    </div>
                    {s}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* User avatar at bottom */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center py-3 gap-1"
        style={{borderTop:`1px solid ${C.border}`}}>
        <div className="flex items-center justify-center rounded-lg"
          style={{
            width: 32, height: 32,
            backgroundColor: C.muted,
            border: `1px solid ${C.border}`,
          }}>
          <span style={{fontSize:11,fontWeight:600,color:C.mutedFg,letterSpacing:"-0.01em"}}>PS</span>
        </div>
        <span style={{fontSize:10,fontWeight:400,color:C.ink4,letterSpacing:"0.01em",lineHeight:1}}>Priya</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════ */
