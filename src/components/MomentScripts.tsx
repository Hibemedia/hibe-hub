import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Script } from "@/lib/scripts";

/** Scripts linked to a content moment (scripts.moment_id). RLS limits clients to shared scripts. */
export function MomentScripts({ momentId, clientId, canEdit }: { momentId: string; clientId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data: all = [] } = useQuery({
    queryKey: ["scripts", "moment", clientId, canEdit],
    queryFn: async () => {
      let q = supabase.from("scripts").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      if (!canEdit) q = q.eq("shared_with_client", true);
      return ((await q).data ?? []) as Script[];
    },
  });
  const linked = all.filter((s) => s.moment_id === momentId);
  const free = all.filter((s) => s.moment_id !== momentId);
  const setMoment = async (id: string, moment_id: string | null) => {
    const { error } = await supabase.from("scripts").update({ moment_id }).eq("id", id);
    if (error) return toast.error("Koppelen lukt niet");
    qc.invalidateQueries({ queryKey: ["scripts"] });
  };
  if (!canEdit && !linked.length) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between"><h3 className="text-sm font-semibold">Scripts</h3>
        {canEdit && <Link to="/hibe/scripts" className="text-xs text-muted-foreground hover:text-foreground">Alle scripts</Link>}</div>
      <ul className="space-y-1.5">
        {linked.map((s) => (
          <li key={s.id} className="rounded-lg border border-border">
            <div className="flex items-center gap-2 px-3 py-2">
              <button className="flex flex-1 items-center gap-2 text-left text-sm font-medium" onClick={() => setOpen(open === s.id ? null : s.id)}>
                <FileText className="h-4 w-4 text-muted-foreground" />{s.title}
              </button>
              {canEdit && <button aria-label="Ontkoppelen" className="text-muted-foreground hover:text-foreground" onClick={() => setMoment(s.id, null)}><X className="h-4 w-4" /></button>}
            </div>
            {open === s.id && <p className="whitespace-pre-line border-t border-border px-3 py-2 text-sm text-foreground/80">{s.body || "Geen tekst."}</p>}
          </li>
        ))}
        {!linked.length && <li className="text-sm text-muted-foreground">Nog geen script gekoppeld.</li>}
      </ul>
      {canEdit && free.length > 0 && (
        <Select value="" onValueChange={(v) => setMoment(v, momentId)}>
          <SelectTrigger className="mt-2 h-9"><SelectValue placeholder="Script koppelen…" /></SelectTrigger>
          <SelectContent>{free.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </div>
  );
}
