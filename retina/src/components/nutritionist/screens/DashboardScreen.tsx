// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C, T } from "../data/tokens";
import { ARTS } from "../data/mockData";
import { NUTRITIONIST_ROUTES } from "../../../router/routes";
import { useNutritionist } from "../NutritionistContext";

/** Dashboard screen — KPI cards + weekly throughput chart + side banners. */

export function DashboardScreen() {
  const navigate = useNavigate();
  const { selectedSites, setQueueTab, setHighlightArtIds } = useNutritionist();
  const goApp = (s) => navigate(`/nutritionist/${s}`);
  const siteArts = ARTS.filter(a => selectedSites.includes(a.site))
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current, -1 = last week, etc.

  const WEEK_HISTORY = {
    0:   [{day:"Mon",count:8},{day:"Tue",count:10},{day:"Wed",count:13},{day:"Thu",count:11},{day:"Fri",count:7},{day:"Sat",count:9},{day:"Sun",count:14}],
    "-1":[{day:"Mon",count:11},{day:"Tue",count:9},{day:"Wed",count:14},{day:"Thu",count:8},{day:"Fri",count:12},{day:"Sat",count:6},{day:"Sun",count:10}],
    "-2":[{day:"Mon",count:7},{day:"Tue",count:13},{day:"Wed",count:10},{day:"Thu",count:15},{day:"Fri",count:9},{day:"Sat",count:11},{day:"Sun",count:8}],
    "-3":[{day:"Mon",count:12},{day:"Tue",count:8},{day:"Wed",count:9},{day:"Thu",count:11},{day:"Fri",count:14},{day:"Sat",count:7},{day:"Sun",count:6}],
    "-4":[{day:"Mon",count:9},{day:"Tue",count:11},{day:"Wed",count:12},{day:"Thu",count:7},{day:"Fri",count:10},{day:"Sat",count:13},{day:"Sun",count:9}],
    "-5":[{day:"Mon",count:6},{day:"Tue",count:14},{day:"Wed",count:8},{day:"Thu",count:12},{day:"Fri",count:11},{day:"Sat",count:9},{day:"Sun",count:7}],
    "-6":[{day:"Mon",count:13},{day:"Tue",count:7},{day:"Wed",count:11},{day:"Thu",count:9},{day:"Fri",count:8},{day:"Sat",count:12},{day:"Sun",count:10}],
    "-7":[{day:"Mon",count:10},{day:"Tue",count:12},{day:"Wed",count:7},{day:"Thu",count:14},{day:"Fri",count:6},{day:"Sat",count:10},{day:"Sun",count:11}],
    "-8":[{day:"Mon",count:8},{day:"Tue",count:9},{day:"Wed",count:13},{day:"Thu",count:10},{day:"Fri",count:12},{day:"Sat",count:8},{day:"Sun",count:9}],
    "-9":[{day:"Mon",count:14},{day:"Tue",count:6},{day:"Wed",count:10},{day:"Thu",count:8},{day:"Fri",count:13},{day:"Sat",count:11},{day:"Sun",count:7}],
    "-10":[{day:"Mon",count:9},{day:"Tue",count:13},{day:"Wed",count:6},{day:"Thu",count:12},{day:"Fri",count:10},{day:"Sat",count:8},{day:"Sun",count:14}],
    "-11":[{day:"Mon",count:11},{day:"Tue",count:10},{day:"Wed",count:15},{day:"Thu",count:6},{day:"Fri",count:9},{day:"Sat",count:13},{day:"Sun",count:8}],
  }
  const chartData = WEEK_HISTORY[String(weekOffset)] || WEEK_HISTORY["0"]
  const chartTotal = chartData.reduce((s,d)=>s+d.count,0)

  const getWeekLabel = (offset) => {
    if(offset === 0) return "This Week"
    if(offset === -1) return "Last Week"
    if(offset === -11) return "12 Weeks Ago (oldest)"
    return `${Math.abs(offset)} Weeks Ago`
  }
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

      {/* Body — fills remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-3">

        {/* Stat Cards */}
        <div className="flex-shrink-0 grid grid-cols-4 gap-3">
          {[
            {label:"TOTAL ARTICLES", val:String(siteArts.length),                                                                                                              accent:C.info, color:C.fg},
            {label:"PENDING REVIEW", val:String(siteArts.filter(a=>a.status!=="green").length),                                                                               accent:C.pr,   color:C.fg},
            {label:"APPROVED",       val:String(siteArts.filter(a=>a.status==="green").length),                                                                               accent:C.gr,   color:C.gr},
            {label:"APPROVAL RATE",  val:siteArts.length === 0 ? "—" : Math.round(siteArts.filter(a=>a.status==="green").length / siteArts.length * 100) + "%",              accent:C.pr,   color:C.fg},
          ].map(m => (
            <div key={m.label}
              style={{
                backgroundColor:C.card, borderRadius:8, padding:"20px 16px",
                border:`1px solid ${C.border}`, borderLeft:`4px solid ${m.accent}`,
                boxShadow:"0 1px 2px rgba(26,26,26,0.05)",
              }}>
              <p style={{...T.kpiLabel, marginBottom:4}}>{m.label}</p>
              <p style={{...T.display, fontSize:28, color:m.color}}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* Chart + side banners — fills remaining space */}
        <div className="flex-1 grid gap-3 min-h-0" style={{gridTemplateColumns:"1fr 280px", alignItems:"stretch"}}>

          {/* Chart */}
          <div style={{backgroundColor:C.card, borderRadius:8, border:`1px solid ${C.border}`,
                       boxShadow:"0 1px 2px rgba(26,26,26,0.05)", overflow:"hidden", display:"flex", flexDirection:"column", height:"75%"}}>
            <div className="flex-shrink-0 px-5 py-2.5 flex items-center justify-between" style={{borderBottom:`1px solid ${C.border}`}}>
              <p style={{...T.h2, fontSize:14, color:C.mutedFg}}>Articles Reviewed This Week</p>
              <div className="flex items-center gap-2">
                <span style={{...T.small}}>{getWeekLabel(weekOffset)} · Total: {chartTotal}</span>
                {/* Prev / Next arrows */}
                <div className="flex items-center" style={{borderRadius:6, border:`1px solid ${C.border}`, overflow:"hidden"}}>
                  <button onClick={()=>setWeekOffset(o=>Math.max(-11, o-1))}
                    disabled={weekOffset===-11}
                    style={{width:24,height:22,display:"flex",alignItems:"center",justifyContent:"center",
                            border:"none",backgroundColor:"transparent",
                            cursor:weekOffset===-11?"not-allowed":"pointer",
                            color:weekOffset===-11?C.border:C.mutedFg,
                            opacity:weekOffset===-11?0.85:1}}
                    onMouseEnter={e=>{ if(weekOffset>-11){e.currentTarget.style.backgroundColor=C.surfHov;e.currentTarget.style.color=C.fg} }}
                    onMouseLeave={e=>{ if(weekOffset>-11){e.currentTarget.style.backgroundColor="transparent";e.currentTarget.style.color=C.mutedFg} }}>
                    <ChevronLeft size={12}/>
                  </button>
                  <div style={{width:1,height:14,backgroundColor:C.border}}/>
                  <button onClick={()=>{ if(weekOffset<0) setWeekOffset(o=>o+1) }}
                    disabled={weekOffset===0}
                    style={{width:24,height:22,display:"flex",alignItems:"center",justifyContent:"center",
                            border:"none",backgroundColor:"transparent",
                            cursor:weekOffset===0?"not-allowed":"pointer",
                            color:weekOffset===0?C.border:C.mutedFg,
                            opacity:weekOffset===0?0.85:1}}
                    onMouseEnter={e=>{ if(weekOffset<0){e.currentTarget.style.backgroundColor=C.surfHov;e.currentTarget.style.color=C.fg} }}
                    onMouseLeave={e=>{ if(weekOffset<0){e.currentTarget.style.backgroundColor="transparent";e.currentTarget.style.color=C.mutedFg} }}>
                    <ChevronRight size={12}/>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 pb-4 pt-3 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap={8} barSize={72} margin={{top:4,right:8,left:0,bottom:0}}>
                  <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="0" strokeWidth={0.5} strokeOpacity={0.6}/>
                  <XAxis dataKey="day" tick={{fontSize:10,fill:C.mutedFg}} axisLine={false} tickLine={false} height={18}/>
                  <YAxis
                    tickCount={8}
                    domain={[0, dataMax => Math.ceil(dataMax/7)*7]}
                    tick={{fontSize:9,fill:C.mutedFg,fontFeatureSettings:'"tnum"'}}
                    axisLine={false} tickLine={false}
                    width={20}
                    tickFormatter={v=>v}
                  />
                  <RTooltip
                    cursor={false}
                    formatter={(v)=>[`${v} articles`]}
                    contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${C.border}`,
                      boxShadow:"0 4px 8px rgba(26,26,26,0.08)",backgroundColor:C.card,padding:"6px 10px",
                      transition:"opacity 0.2s ease"}}
                    itemStyle={{color:C.fg,fontWeight:600}}
                    labelStyle={{color:C.mutedFg,fontWeight:500,marginBottom:2}}
                    animationDuration={200}
                    animationEasing="ease-out"
                  />
                  <Bar dataKey="count" radius={[5,5,0,0]} animationDuration={600} animationEasing="ease-out">
                    {chartData.map((d,i)=><Cell key={i} fill={weekOffset===0&&i===6?C.pr:C.prBdr}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side column — full height, Incremental Load fills remaining */}
          <div className="flex flex-col gap-3" style={{height:"75%"}}>

            {/* Stats box */}
            <div className="flex-1 flex flex-col" style={{backgroundColor:C.card, borderRadius:8, border:`1px solid ${C.border}`,
                         boxShadow:"0 1px 2px rgba(26,26,26,0.05)", overflow:"hidden"}}>
              <div className="flex-shrink-0 px-4 py-2.5" style={{borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:11,fontWeight:600,color:C.mutedFg,textTransform:"uppercase",letterSpacing:"0.07em"}}>Daily Reviewed</span>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col justify-center px-5 py-4" style={{borderBottom:`1px solid ${C.border}`}}>
                  <p style={{...T.kpiLabel, marginBottom:6}}>Average Approved / Day</p>
                  <p style={{fontSize:28,fontWeight:700,color:C.fg,letterSpacing:"-0.02em",lineHeight:1}}>10.3</p>
                </div>
                <div className="flex-1 flex flex-col justify-center px-5 py-4">
                  <p style={{...T.kpiLabel, marginBottom:6}}>Today Approved</p>
                  <p style={{fontSize:28,fontWeight:700,color:C.pr,letterSpacing:"-0.02em",lineHeight:1}}>14</p>
                </div>
              </div>
            </div>

            {/* Needs Attention */}
            {(() => {
              const total = siteArts.filter(a=>a.status==="amber").length + siteArts.filter(a=>a.status==="red").length
              return (
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 cursor-pointer"
                  onClick={()=>{ setQueueTab("amber"); goApp("queue") }}
                  style={{
                    backgroundColor:"#FEF3E0", border:`1px solid #E8C97A`,
                    borderLeft:`4px solid ${C.pr}`, borderRadius:8,
                    transition:"background-color 0.15s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="#FDE8C0"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="#FEF3E0"}>
                  <div>
                    <p style={{fontSize:10,fontWeight:700,color:C.am,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>Needs Attention</p>
                    <p style={{fontSize:13,fontWeight:400,color:C.ink2,lineHeight:1.6}}>
                      26 articles need your attention, review them now.
                    </p>
                  </div>
                  <ChevronRight size={14} style={{color:C.am,flexShrink:0,marginLeft:12}}/>
                </div>
              )
            })()}

            {/* Incremental Article */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 cursor-pointer"
              onClick={()=>{
                const ids = ARTS.filter(a=>a.at?.startsWith("Today")).slice(1,4).map(a=>a.id)
                setHighlightArtIds(ids)
                setQueueTab("amber")
                goApp("queue")
                setTimeout(()=>setHighlightArtIds([]), 3000)
              }}
              style={{
                backgroundColor:"#E8EEF8", border:`1px solid #B8C9E8`,
                borderLeft:`4px solid #3B5FA0`, borderRadius:8,
                transition:"background-color 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor="#D4E0F0"}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="#E8EEF8"}>
              <div>
                <p style={{fontSize:10,fontWeight:700,color:"#2A4480",textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>Incremental Article</p>
                <p style={{fontSize:13,fontWeight:400,color:"#3B5FA0",lineHeight:1.6}}>
                  3 new articles added from store manager on 16 May.
                </p>
              </div>
              <ChevronRight size={14} style={{color:"#3B5FA0",flexShrink:0,marginLeft:12}}/>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
