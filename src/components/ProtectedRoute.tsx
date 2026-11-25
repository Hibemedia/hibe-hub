import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "@/context/AuthContext.jsx";
import { supabase } from "@/integrations/supabase/client";
import { TwoFactor } from "@/components/TwoFactor";
import { Button } from "@/components/ui/button";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = UserAuth();
  const loc = useLocation();
  const [checkedFor, setCheckedFor] = useState<string | null>(null);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!user?.id) { setCheckedFor(null); return; }
    let active = true;
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      if (!active) return;
      setFailed(!!error);
      setNeedsMfa(data?.nextLevel === "aal2" && data.currentLevel !== "aal2");
      setCheckedFor(user.id);
    });
    return () => { active = false; };
  }, [user?.id]);
  useEffect(() => {
    if (user?.id && checkedFor === user.id && !needsMfa && !failed) supabase.rpc("touch_user_activity").then(({ error }) => { if (error) console.warn("Activiteit kon niet worden geregistreerd"); });
  }, [user?.id, checkedFor, needsMfa, failed, loc.pathname]);
  if (loading) return <p className="p-6 text-sm text-muted-foreground">Laden…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (checkedFor !== user.id) return <p className="p-6 text-sm text-muted-foreground">Account controleren…</p>;
  if (failed) return <div className="space-y-3 p-6"><p>Je account kon niet worden gecontroleerd.</p><Button onClick={() => window.location.reload()}>Opnieuw proberen</Button></div>;
  if (needsMfa) return <div className="mx-auto max-w-md space-y-4 p-6"><TwoFactor challenge onVerified={() => setNeedsMfa(false)} /><Button variant="ghost" onClick={() => supabase.auth.signOut()}>Uitloggen</Button></div>;
  return children;
};
export default ProtectedRoute;
