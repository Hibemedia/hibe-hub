import { Navigate } from "react-router-dom";
import { useClient } from "@/context/ClientContext";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { isAdmin, ready } = useClient();
  if (!ready) return <div className="p-6 text-sm text-muted-foreground">Laden…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
