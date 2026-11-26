import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Idea = { title: string; trend: string; hook: string; script: string };

export function ScriptIdeas({ open, onOpenChange, initialClient }: { open: boolean; onOpenChange: (o: boolean) => void; initialClient?: string | null }) {
  const { clients, refreshClients } = useClient();
  const qc = useQueryClient();
  const [clientId, setClientId] = useState(initialClient ?? "");
  const [brief, setBrief] = useState("");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ trends: string[]; ideas: Idea[] } | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  useEffect(() => { if (open && initialClient) setClientId(initialClient); }, [open, initialClient]);
  useEffect(() => { setBrief(clients.find((c) => c.id === clientId)?.brief ?? ""); setRes(null); setSaved(new Set()); }, [clientId, clients]);

  const [savingBrief, setSavingBrief] = useState(false);
  const briefDirty = !!clientId && brief.trim() !== (clients.find((c) => c.id === clientId)?.brief ?? "").trim();
  const saveBrief = async () => {
    if (!clientId) return;
    setSavingBrief(true);
    const { error } = await supabase.from("clients").update({ brief: brief.trim() || null }).eq("id", clientId);
    setSavingBrief(false);
    if (error) return toast.error("Opslaan lukt niet");
    refreshClients(); toast.success("Klantinformatie opgeslagen");
  };

  const generate = async () => {
    if (!clientId) return toast.error("Kies eerst een klant");
    setBusy(true); setRes(null); setSaved(new Set());
    const cur = clients.find((c) => c.id === clientId)?.brief ?? "";
    if (brief.trim() !== cur) { await supabase.from("clients").update({ brief: brief.trim() || null }).eq("id", clientId); refreshClients(); }
    const { data, error } = await supabase.functions.invoke("script-ideas", { body: { client_id: clientId, focus: focus.trim() || null } });
    setBusy(false);
    if (error || data?.error) {
      let msg = data?.error;
      try { msg ??= (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
      return toast.error(msg ?? "Ideeën maken lukt nu niet");
    }
    setRes(data);
  };
  const save = async (i: number, idea: Idea) => {
    const { error } = await supabase.from("scripts").insert({ client_id: clientId, title: idea.title, body: `Hook: ${idea.hook}\n\n${idea.script}\n\nTrend: ${idea.trend}` });
    if (error) return toast.error("Opslaan lukt niet");
    setSaved((s) => new Set(s).add(i)); qc.invalidateQueries({ queryKey: ["scripts"] }); toast.success("Opgeslagen bij Scripts");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>Ideeën op basis van trends</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <div><Label>Klant</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Kies klant" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Over deze klant</Label>
            <Textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={2000} placeholder="Bijv. interieurwinkel in Utrecht, verkoopt vooral design-banken, doelgroep 30–50 jaar" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Wordt bewaard bij de klant en gebruikt voor elke volgende keer.</p>
              <Button size="sm" variant="outline" onClick={saveBrief} disabled={!briefDirty || savingBrief}>{savingBrief ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Opslaan</Button>
            </div></div>
          <div><Label>Focus (optioneel)</Label><Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Bijv. nieuwe collectie banken, kerst" /></div>
          <Button onClick={generate} disabled={busy || !clientId} className="w-full">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Trends zoeken… (kan een minuut duren)</> : <><Sparkles className="h-4 w-4" />Bedenk ideeën</>}
          </Button>
        </div>
        {res && (
          <div className="mt-6 space-y-4">
            {res.trends.length > 0 && <div><h3 className="mb-1.5 text-sm font-semibold">Trends nu</h3><ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">{res.trends.map((t) => <li key={t}>{t}</li>)}</ul></div>}
            {res.ideas.map((idea, i) => (
              <article key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{idea.title}</h4>
                  <Button size="sm" variant="outline" disabled={saved.has(i)} onClick={() => save(i, idea)}><Save className="h-4 w-4" />{saved.has(i) ? "Opgeslagen" : "Opslaan"}</Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Trend: {idea.trend}</p>
                <p className="mt-2 text-sm font-medium">Hook: {idea.hook}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{idea.script}</p>
              </article>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
