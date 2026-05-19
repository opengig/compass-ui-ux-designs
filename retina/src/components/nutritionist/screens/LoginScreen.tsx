// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui";
import { C, T } from "../data/tokens";
import { COMPASS_LOGO } from "../data/images";
import { NUTRITIONIST_ROUTES } from "../../../router/routes";
import { useNutritionist } from "../NutritionistContext";

/** Login screen — single "Sign in with Microsoft" entry point. */

export function LoginScreen() {
  const navigate = useNavigate();
  const { setIsAuthed } = useNutritionist();
  const onLogin = () => {
    setIsAuthed(true);
    navigate(NUTRITIONIST_ROUTES.dashboard);
  };
  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.page}}>
      <Card className="w-80 shadow-md" style={{backgroundColor:C.card,borderColor:C.border}}>
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mx-auto mb-3">
            <img src={COMPASS_LOGO} alt="Compass Group" style={{width:52,height:52,objectFit:"contain"}}/>
          </div>
          <CardTitle style={{fontSize:26,fontWeight:600,color:C.fg,letterSpacing:"-0.015em"}}>Retina.AI</CardTitle>
          <CardDescription style={{...T.helper,marginTop:4}}>Food Article Intelligence · Nutritionist Portal</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <button className="w-full inline-flex items-center justify-center gap-2" onClick={onLogin}
            style={{height:38,fontSize:13,fontWeight:500,backgroundColor:"#C68A1E",color:"#fff",
                    border:"none",borderRadius:8,cursor:"pointer",transition:"background-color 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor="#B27A18"}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor="#C68A1E"}>
            <svg width="14" height="14" viewBox="0 0 16 16"><rect x="0" y="0" width="7" height="7" fill="#F25022"/><rect x="9" y="0" width="7" height="7" fill="#7FBA00"/><rect x="0" y="9" width="7" height="7" fill="#00A4EF"/><rect x="9" y="9" width="7" height="7" fill="#FFB900"/></svg>
            Sign in with Microsoft
          </button>
          <div className="h-px my-4" style={{backgroundColor:C.border}}/>
          <p className="text-center leading-relaxed" style={{...T.helper,textAlign:"center"}}>Access is role-based. Contact your admin if you cannot log in.</p>
        </CardContent>
      </Card>
    </div>
  )
}
