import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { pdfText, splitScripts, type SplitScript } from "@/lib/scripts-split";

const fmt = (d: string) => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

export function ScriptPdfImport({ open, onOpenChange, clients, initialClient }: { open: boolean; onOpenChange: (o: boolean) => void; clients: { id: string; name: string }[]; initialClient: string | null }) {
  const qc = useQueryClient();
  const [client, setClient] = useState<string>(initialClient ?? "");
  const [moment, setMoment] = useState<string>("");
  const [parts, setParts] = useState<SplitScript[]>([]);
  const [busy, setBusy] = useState(false);
  const { data: moments = [] } = useQuery({
    queryKey: ["script-moments", client], enabled: !!client,
    queryFn: async () => (await supabase.from("content_moments").select("id,title,date").eq("client_id", client).order("date", { ascending: false })).data ?? [],
  });
  const close = () => { setParts([]); setMoment(""); onOpenChange(false); };
  const read = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const list = splitScripts(await pdfText(f), f.name.replace(/\.pdf$/i, ""));
      if (!list.length) toast.error("Geen tekst gevonden in deze PDF (is het een scan?)");
      setParts(list);
    } catch { toast.error("Deze PDF kan niet gelezen worden"); }
    finally { setBusy(false); }
  };
  const save = async () => {
    const rows = parts.filter((p) => p.title.trim()).map((p) => ({ client_id: client, moment_id: moment, title: p.title.trim().slice(0, 200), body: p.body }));
    setBusy(true);
    const { error } = await supabase.from("scripts").insert(rows);
    setBusy(false);
    if (error) return toast.error("Opslaan lukt niet");
    toast.success(`${rows.length} scripts opgeslagen bij de draaidag`);
    qc.invalidateQueries({ queryKey: ["scripts"] }); close();
  };
  const set = (i: number, p: Partial<SplitScript>) => setParts((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>PDF van draaidag uploaden</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Klant</Label>
              <Select value={client} onValueChange={(v) => { setClient(v); setMoment(""); }}>
                <SelectTrigger><SelectValue placeholder="Kies klant" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Draaidag</Label>
              <Select value={moment} onValueChange={setMoment} disabled={!client}>
                <SelectTrigger><SelectValue placeholder="Kies draaidag" /></SelectTrigger>
                <SelectContent>{moments.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}{m.date ? ` · ${fmt(m.date)}` : ""}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div><Label>PDF met goedgekeurde scripts</Label>
            <Input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(e) => read(e.target.files?.[0])} />
            <p className="mt-1 text-xs text-muted-foreground">Elk script begint bij een kop als "Script 1: titel". Controleer de verdeling hieronder voor je opslaat.</p>
          </div>
          {parts.map((p, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-semibold">Script {i + 1}</span>
                <Input value={p.title} onChange={(e) => set(i, { title: e.target.value })} aria-label={`Titel script ${i + 1}`} />
                <Button variant="ghost" size="sm" aria-label="Weglaten" onClick={() => setParts((l) => l.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <Textarea value={p.body} onChange={(e) => set(i, { body: e.target.value })} rows={5} />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>Annuleren</Button>
            <Button disabled={busy || !client || !moment || !parts.length} onClick={save}>{parts.length ? `${parts.length} scripts opslaan` : "Opslaan"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
