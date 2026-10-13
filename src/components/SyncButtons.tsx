import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { toast } from "sonner";

export function SyncButtons() {
  const { isAdmin } = UserAuth();
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (typeof isAdmin === "function") Promise.resolve(isAdmin()).then((ok) => setAdmin(!!ok)).catch(() => setAdmin(false));
  }, [isAdmin]);
  if (!admin) return null;

  const run = async (mode: "refresh" | "backfill") => {
    setBusy(mode);
    const { data, error } = await supabase.functions.invoke("metricool-sync", { body: { mode } });
    setBusy(null);
    if (error || data?.error) return toast.error("Verversen mislukt");
    if (mode === "backfill") toast.success("Historie wordt opgehaald — dit duurt een paar minuten.");
    else toast.success("Cijfers ververst");
    qc.invalidateQueries({ queryKey: ["client-stats"] });
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("refresh")}>
        <RefreshCw className={`h-4 w-4 mr-1.5 ${busy === "refresh" ? "animate-spin" : ""}`} /> Nu verversen
      </Button>
      <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run("backfill")}>
        <History className="h-4 w-4 mr-1.5" /> Historie ophalen
      </Button>
    </div>
  );
}
