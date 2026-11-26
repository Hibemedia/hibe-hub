import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Scissors, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

/** Create the edit for a script: video link + editor; assigning runs via assign-edit-editor so the editor gets a mail. */
export async function createEditForScript(s: Script, shootDate: string | null, drive: string | null, editor: string | null) {
  const { data, error } = await db.from("edits").insert({ client_id: s.client_id, title: s.title, status: "assign", script_id: s.id, moment_id: s.moment_id, shoot_date: shootDate, drive_link: drive }).select("id").single();
  if (error) throw error;
  if (editor) await supabase.functions.invoke("assign-edit-editor", { body: { edit_id: data.id, editor_id: editor } });
}

export function ScriptEditPanel({ script, shootDate }: { script: Script; shootDate: string | null }) {
  const qc = useQueryClient();
  const { data: team = [] } = useTeamMembers();
  const { data: map = {} } = useScriptEdits([script.id]);
  const edit = map[script.id];
  const [drive, setDrive] = useState("");
  const [editor, setEditor] = useState("none");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["edits"] });

  const create = async () => {
    setBusy(true);
    try { await createEditForScript(script, shootDate, drive.trim() || null, editor === "none" ? null : editor); toast.success("Edit aangemaakt"); setDrive(""); refresh(); }
    catch { toast.error("Edit maken lukt niet"); } finally { setBusy(false); }
  };
  const assign = async (v: string) => {
    const { error } = await supabase.functions.invoke("assign-edit-editor", { body: { edit_id: edit!.id, editor_id: v === "none" ? null : v } });
    if (error) toast.error("Toewijzen lukt niet"); refresh();
  };
  const saveDrive = async (v: string) => {
    if ((edit?.drive_link ?? "") === v.trim()) return;
    const { error } = await db.from("edits").update({ drive_link: v.trim() || null }).eq("id", edit!.id);
    if (error) toast.error("Opslaan lukt niet"); else toast.success("Videolink opgeslagen"); refresh();
  };
  const editors = <SelectContent><SelectItem value="none">Geen editor</SelectItem>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>;

  return (
    <section className="mt-4 rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2"><Scissors className="h-4 w-4" /><h3 className="font-semibold">Video & edit</h3>
        {edit && <Tag className="ml-auto">{EDIT_STATUS_LABEL[edit.status]}</Tag>}</div>
      {edit ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <Input key={edit.id} defaultValue={edit.drive_link ?? ""} onBlur={(e) => saveDrive(e.target.value)} placeholder="Link naar de video (Drive)" aria-label="Videolink" />
          <Select value={edit.editor_id ?? "none"} onValueChange={assign}><SelectTrigger aria-label="Editor"><SelectValue /></SelectTrigger>{editors}</Select>
          <Button variant="outline" asChild><Link to={`/hibe/edits?edit=${edit.id}`}><ExternalLink className="h-4 w-4" />Open edit</Link></Button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <Input value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="Link naar de video (Drive)" aria-label="Videolink" />
          <Select value={editor} onValueChange={setEditor}><SelectTrigger aria-label="Editor"><SelectValue /></SelectTrigger>{editors}</Select>
          <Button disabled={busy} onClick={create}>Maak edit</Button>
        </div>
      )}
    </section>
  );
}
