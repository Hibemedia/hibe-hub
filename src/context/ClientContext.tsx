import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";

export interface ClientRow {
  id: string;
  name: string;
  metricool_blog_id: string | null;
  metricool_brand_label?: string | null;
  tiktok_handle: string | null;
  logo_url: string | null;
}

interface Ctx {
  isAdmin: boolean;
  ready: boolean;
  clients: ClientRow[];
  clientId: string | null;
  client: ClientRow | null;
  setClientId: (id: string) => void;
  refreshClients: () => Promise<void>;
}

const ClientCtx = createContext<Ctx>({
  isAdmin: false, ready: false, clients: [], clientId: null, client: null,
  setClientId: () => {}, refreshClients: async () => {},
});
const KEY = "hibe.selectedClient";

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user } = UserAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientId, setClientIdState] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setReady(false); setClients([]); setClientIdState(null); setIsAdmin(false); return; }
    const [{ data: role }, { data: me }, { data: list }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      supabase.from("users").select("client_id").eq("id", user.id).maybeSingle(),
      supabase.from("clients").select("id,name,metricool_blog_id,metricool_brand_label,tiktok_handle,logo_url").order("name"),
    ]);
    const admin = !!role;
    const rows = (list ?? []) as ClientRow[];
    setIsAdmin(admin);
    setClients(rows);
    if (admin) {
      const saved = localStorage.getItem(KEY);
      const pick = rows.find((c) => c.id === saved)?.id ?? me?.client_id ?? rows[0]?.id ?? null;
      setClientIdState(pick);
    } else {
      setClientIdState(me?.client_id ?? null);
    }
    setReady(true);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const setClientId = (id: string) => {
    if (!isAdmin) return;
    localStorage.setItem(KEY, id);
    setClientIdState(id);
  };

  return (
    <ClientCtx.Provider value={{
      isAdmin, ready, clients, clientId, client: clients.find((c) => c.id === clientId) ?? null,
      setClientId, refreshClients: load,
    }}>
      {children}
    </ClientCtx.Provider>
  );
}

export const useClient = () => useContext(ClientCtx);
