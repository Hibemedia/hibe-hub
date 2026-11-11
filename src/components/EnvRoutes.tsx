import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ViewAsProvider } from "@/context/ViewAs";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useClient } from "@/context/ClientContext";
import { AppSidebar } from "@/components/AppSidebar";
import { FrameTopBar, ClientScopeBar } from "@/components/TopBar";
import { PageHeaderProvider } from "@/components/PageHeader";
import ProtectedRoute from "@/components/ProtectedRoute";

const Loading = () => <div className="p-6 text-sm text-muted-foreground">Laden…</div>;

/** Klantomgeving: only for client users; HIBE staff are sent to /hibe. */
export function ClientEnv() {
  const { isAdmin, ready } = useClient();
  return (
    <ProtectedRoute>
      {!ready ? <Loading /> : isAdmin ? <Navigate to="/hibe" replace /> : (
        <PageHeaderProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar variant="client" />
            <main className="min-w-0 flex-1 pb-20 md:pb-0"><FrameTopBar variant="client" /><Outlet /></main>
          </div>
        </PageHeaderProvider>
      )}
    </ProtectedRoute>
  );
}

/** HIBE-omgeving: admins only; client users are sent back to /. */
export function HibeEnv() {
  const { isAdmin, ready } = useClient();
  return (
    <ProtectedRoute>
      {!ready ? <Loading /> : !isAdmin ? <Navigate to="/" replace /> : (
        <PageHeaderProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar variant="hibe" />
            <main className="min-w-0 flex-1 pb-20 md:pb-0"><FrameTopBar variant="hibe" /><Outlet /></main>
          </div>
        </PageHeaderProvider>
      )}
    </ProtectedRoute>
  );
}

/** /hibe/klant/:id — selects that client so the regular client pages show its data. */
export function HibeClientScope() {
  const { id } = useParams();
  const { clientId, setClientId, clients } = useClient();
  useEffect(() => { if (id && id !== clientId) setClientId(id); }, [id, clientId, setClientId]);
  if (clients.length && !clients.some((c) => c.id === id)) return <Navigate to="/hibe/klanten" replace />;
  if (clientId !== id) return <Loading />;
  return <><ClientScopeBar id={id!} /><Outlet /></>;
}

/** /hibe/als/:id — HIBE looks at the client environment exactly as that client sees it (read-only, logged server-side). */
export function ViewAsEnv() {
  const { id } = useParams();
  const { isAdmin, ready, clients, clientId, setClientId } = useClient();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");
  const c = clients.find((x) => x.id === id);
  const logos = useLogoUrls([c?.logo_url]);
  useEffect(() => {
    if (!ready || !isAdmin || !id) return;
    const key = `hibe.viewas.${id}`;
    if (sessionStorage.getItem(key)) { setState("ok"); return; }
    (supabase as any).rpc("start_view_as", { _client: id }).then(({ error }: any) => {
      if (error) setState("denied"); else { sessionStorage.setItem(key, "1"); setState("ok"); }
    });
  }, [ready, isAdmin, id]);
  useEffect(() => { if (state === "ok" && id && id !== clientId) setClientId(id); }, [state, id, clientId, setClientId]);
  return (
    <ProtectedRoute>
      {!ready ? <Loading /> : !isAdmin ? <Navigate to="/" replace /> : state === "denied" ? <Navigate to="/hibe/klanten" replace /> : state === "checking" || clientId !== id ? <Loading /> : (
        <ViewAsProvider clientId={id!}>
          <PageHeaderProvider>
            <div role="status" className="sticky top-0 z-[60] flex h-11 items-center gap-3 bg-foreground px-3 text-sm text-background md:px-5">
              <Eye className="h-4 w-4 shrink-0" />
              <ClientLogo url={c?.logo_url ? logos[c.logo_url] : null} name={c?.name ?? "Klant"} size={22} />
              <span className="min-w-0 flex-1 truncate">Je bekijkt HIBE Hub als <b>{c?.name}</b></span>
              <Link to={`/hibe/klant/${id}`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-lime px-3 font-semibold text-lime-foreground"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Terug naar HIBE</span><span className="sm:hidden">Terug</span></Link>
            </div>
            <div className="flex min-h-[calc(100vh-2.75rem)] w-full">
              <AppSidebar variant="client" />
              <main className="min-w-0 flex-1 pb-20 md:pb-0"><FrameTopBar variant="client" /><Outlet /></main>
            </div>
          </PageHeaderProvider>
        </ViewAsProvider>
      )}
    </ProtectedRoute>
  );
}
