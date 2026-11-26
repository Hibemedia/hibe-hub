import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useViewAs } from "@/context/ViewAs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/** Edits the client's shared style, not a separate style for this video. */
export function CapcutStylePanel({ clientId }: { clientId: string }) {
  const { allClients, isAdmin, refreshClients } = useClient();
  const viewAs = useViewAs();
  const client = allClients.find((row) => row.id === clientId);
  const style = client?.capcut_style ?? "";
  const canEdit = isAdmin && !viewAs;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!canEdit || !client || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.from("clients")
        .update({ capcut_style: draft.trim() || null }).eq("id", clientId).select("id").single();
      if (error || !data) throw error ?? new Error("Opslaan mislukt");
      await refreshClients();
      setEditing(false);
      toast.success("CapCut-stijl opgeslagen");
    } catch {
      toast.error("CapCut-stijl opslaan mislukt; probeer opnieuw");
    } finally {
      setBusy(false);
    }
  };

  if (!client || (!style && !canEdit)) return null;
  return (
    <section className="space-y-3" aria-label="CapCut-stijl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">CapCut-stijl</p>
        {canEdit && !editing && <Button size="sm" variant="outline" onClick={() => { setDraft(style); setEditing(true); }}><Pencil className="h-4 w-4" />{style ? "Bewerken" : "Stijl toevoegen"}</Button>}
      </div>
      {editing ? (
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <Textarea aria-label="CapCut-stijl aanpassen" value={draft} onChange={(event) => setDraft(event.target.value)} rows={10} maxLength={3000} disabled={busy} placeholder="Lettertype, grootte, kleur, positie en schaduw…" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" type="submit" disabled={busy || draft.trim() === style.trim()}><Save className="h-4 w-4" />{busy ? "Opslaan…" : "Stijl opslaan"}</Button>
            <Button size="sm" type="button" variant="outline" disabled={busy} onClick={() => setEditing(false)}><X className="h-4 w-4" />Annuleren</Button>
          </div>
        </form>
      ) : <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground">{style || "Nog geen CapCut-stijl."}</p>}
    </section>
  );
}