// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Bell, Package, ChevronRight } from "lucide-react";
import { Card, CardContent } from "../components/ui";
import { C } from "../data/tokens";
import { ARTS } from "../data/mockData";
import { PageHeader } from "../components/shared";
import { StatusBadge } from "../components/shared";
import { BtnPrimary } from "../components/buttons";

/** Notifications screen — pending action card + recent alerts feed. */

export function NotifScreen() {
  const navigate = useNavigate();
  const goApp = (s) => navigate(`/nutritionist/${s}`);
  const notifs = [
    {id:1, title:"5 articles pending your review", body:"Dietary Fibre, Sodium, and Calcium values are missing or estimated by LLM. Please verify before approving.", time:"Today, 10:32 AM", unread:true, count:5},
    {id:2, title:"Ingredient update from Procurement", body:"Britannia Bread 400g ingredients have been updated by the Procurement team. Allergen review may be required.", time:"Today, 08:15 AM", unread:true, count:1},
    {id:3, title:"Article SME flagged 2 items", body:"2 articles were flagged by the Article SME for allergen discrepancies. Action required before next sync.", time:"Yesterday, 4:45 PM", unread:false, count:2},
    {id:4, title:"Weekly summary: 47 articles reviewed", body:"You reviewed 47 articles this week with an approval rate of 74%. 12 were returned to queue for re-scan.", time:"Mon, 9:00 AM", unread:false, count:null},
  ]
  return (
    <div className="flex-1 overflow-y-auto" style={{backgroundColor:C.page}}>
      <PageHeader title="Notifications"/>
      <div className="px-6 pb-6 space-y-3 max-w-2xl">

        {/* Pending review alert card */}
        <Card className="overflow-hidden shadow-sm" style={{borderColor:C.border}}>
          <div className="px-5 py-3 flex items-center justify-between" style={{backgroundColor:C.prBg, borderBottom:`1px solid ${C.prBdr}`}}>
            <div className="flex items-center gap-2">
              <Bell size={13} style={{color:C.pr}}/>
              <span style={{fontSize:11,fontWeight:700,color:C.pr,textTransform:"uppercase",letterSpacing:"0.05em"}}>Pending Action</span>
            </div>
            <span style={{fontSize:11,color:C.pr,fontWeight:500}}>{new Date().toLocaleString("en-IN",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
          </div>
          <CardContent className="p-5">
            <p style={{fontSize:14,fontWeight:600,color:C.fg,marginBottom:4}}>5 articles pending your review</p>
            <p style={{fontSize:12,color:C.mutedFg,marginBottom:16,lineHeight:1.6}}>The following articles require your review before they can be pushed to the Cookbook API.</p>
            {ARTS.slice(0,5).map((a,i)=>(
              <div key={a.id} className="flex items-center gap-3 py-2.5" style={{borderBottom:i<4?`1px solid ${C.border}`:"none"}}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{backgroundColor:C.amBg,border:`1px solid ${C.amBdr}`}}>
                  <Package size={12} style={{color:C.am}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{fontSize:13,fontWeight:600,color:C.fg}}>{a.name}</p>
                  <p style={{fontSize:11,color:C.mutedFg,fontFeatureSettings:'"tnum"'}}>{a.apl} · {a.site}</p>
                </div>
                <StatusBadge status={a.status}/>
              </div>
            ))}
            <BtnPrimary className="w-full mt-4 justify-center" style={{height:38}} onClick={()=>goApp("queue")}>
              Open Review Queue <ChevronRight size={14}/>
            </BtnPrimary>
          </CardContent>
        </Card>

        {/* Notification feed */}
        <Card className="overflow-hidden shadow-sm" style={{borderColor:C.border}}>
          <div className="px-5 py-3" style={{borderBottom:`1px solid ${C.border}`}}>
            <p style={{fontSize:11,fontWeight:700,color:C.mutedFg,textTransform:"uppercase",letterSpacing:"0.05em"}}>Recent Alerts</p>
          </div>
          {notifs.map((n,i)=>(
            <div key={n.id} className="flex gap-3 px-5 py-4 transition-colors cursor-pointer"
              style={{borderBottom:i<notifs.length-1?`1px solid ${C.border}`:"none",backgroundColor:"transparent"}}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.page}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1.5">
                {n.unread
                  ? <div className="w-2 h-2 rounded-full" style={{backgroundColor:C.pr}}/>
                  : <div className="w-2 h-2 rounded-full" style={{backgroundColor:C.border}}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p style={{fontSize:13,fontWeight:n.unread?700:600,color:C.fg}}>{n.title}</p>
                  {n.count && (
                    <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full"
                      style={{fontSize:10,fontWeight:700,minWidth:20,height:20,padding:"0 5px",backgroundColor:C.amBg,color:C.am}}>
                      {n.count}
                    </span>
                  )}
                </div>
                <p style={{fontSize:12,color:C.mutedFg,lineHeight:1.6,marginBottom:4}}>{n.body}</p>
                <p style={{fontSize:11,color:C.mutedFg,opacity:0.7}}>{n.time}</p>
              </div>
            </div>
          ))}
        </Card>

        <p className="text-center" style={{fontSize:10,color:C.mutedFg}}>retina.ai · Compass Group India · Automated alerts</p>
      </div>
    </div>
  )
}
