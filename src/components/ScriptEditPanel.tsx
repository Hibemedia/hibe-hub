import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Scissors, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { EDIT_STATUS_LABEL, type EditStatus } from "@/lib/edits";
import type { Script } from "@/lib/scripts";
import { toast } from "sonner";

const db = supabase as any;
type LinkedEdit = { id: string; status: EditStatus; editor_id: string | null; drive_link: string | null };

export function useScriptEdits(ids: string[]) {
  return useQuery({
    queryKey: ["edits", "by-script", ids.join()], enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await db.from("edits").select("id,script_id,status,editor_id,drive_link").in("script_id", ids);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((e: any) => [e.script_id, e])) as Record<string, LinkedEdit>;
    },
  });
}

/** Create an unassigned edit; video links and editors are managed on the Edits page. */
export async function createEditForScript(s: Script, shootDate: string | null) {
  const { error } = await db.from("edits").insert({ client_id: s.client_id, title: s.title, status: "assign", script_id: s.id, moment_id: s.moment_id, shoot_date: shootDate });
  if (error) throw error;
}

export function ScriptEditPanel({ script, shootDate }: { script: Script; shootDate: string | null }) {
  const qc = useQueryClient();
  const { data: map = {} } = useScriptEdits([script.id]);
  const edit = map[script.id];
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["edits"] });

  const create = async () => {
    setBusy(true);
    try { await createEditForScript(script, shootDate); toast.success("Edit aangemaakt"); refresh(); }
    catch { toast.error("Edit maken lukt niet"); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!edit) return;
    if (!confirm("Deze edit verwijderen? Het script blijft bestaan.")) return;
    const { error } = await db.from("edits").delete().eq("id", edit.id);
    if (error) toast.error("Verwijderen lukt niet"); else toast.success("Edit verwijderd"); refresh();
  };

  return (
    <section className="mt-4 rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2"><Scissors className="h-4 w-4" /><h3 className="font-semibold">Video & edit</h3>
        {edit && <Tag className="ml-auto">{EDIT_STATUS_LABEL[edit.status]}</Tag>}</div>
      {edit ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to={`/hibe/edits?edit=${edit.id}`}><ExternalLink className="h-4 w-4" />Open edit</Link></Button>
          <Button variant="ghost" onClick={remove} aria-label="Edit verwijderen"><Trash2 className="h-4 w-4" />Verwijderen</Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={create}>Maak edit</Button>
        </div>
      )}
    </section>
  );
}
