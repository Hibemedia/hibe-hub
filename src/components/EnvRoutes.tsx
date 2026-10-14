import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useClient } from "@/context/ClientContext";
import { AppSidebar } from "@/components/AppSidebar";
import { ClientTopBar, HibeTopBar, ClientScopeBar } from "@/components/TopBar";
import ProtectedRoute from "@/components/ProtectedRoute";

const Loading = () => <div className="p-6 text-sm text-muted-foreground">Laden…</div>;

/** Klantomgeving: only for client users; HIBE staff are sent to /hibe. */
export function ClientEnv() {
  const { isAdmin, ready } = useClient();
  return (
    <ProtectedRoute>
      {!ready ? <Loading /> : isAdmin ? <Navigate to="/hibe" replace /> : (
        <div className="flex min-h-screen w-full">
          <AppSidebar variant="client" />
          <main className="min-w-0 flex-1 pb-24 md:pb-0"><ClientTopBar /><Outlet /></main>
        </div>
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
        <div className="flex min-h-screen w-full">
          <AppSidebar variant="hibe" />
          <main className="min-w-0 flex-1 pb-24 md:pb-0"><HibeTopBar /><Outlet /></main>
        </div>
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
