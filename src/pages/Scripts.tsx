import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Upload, Copy, ExternalLink, EyeOff, Send, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useViewAs } from "@/context/ViewAs";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag } from "@/components/ui/tag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScriptIdeas } from "@/components/ScriptIdeas";
import { filterScripts, usedScripts, type MomentInfo, type Script } from "@/lib/scripts";

const fmt = (d: string) => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const NONE = "__none";

/** scope "hibe": all clients (/hibe/scripts). scope "client": selected client only. */
export default function Scripts({ scope = "client" }: { scope?: "hibe" | "client" }) {
  const { isAdmin, clients, clientId, ready } = useClient();
  const viewAs = useViewAs();
  const canEdit = isAdmin && !viewAs;
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState(false);
  const [edit, setEdit] = useState<Partial<Script> | null>(null);

  const { data: scripts = [] } = useQuery({
    queryKey: ["scripts", scope, clientId], enabled: ready && (scope === "hibe" || !!clientId),
    queryFn: async () => {
      let qb = supabase.from("scripts").select("*").order("created_at", { ascending: false });
      if (scope === "client") qb = qb.eq("client_id", clientId!);
      if (scope === "client" && (!isAdmin || viewAs)) qb = qb.eq("shared_with_client", true);
      const { data, error } = await qb;
      if (error) throw error;
      return data as Script[];
    },
  });
  const { data: days = {} } = useQuery({
    queryKey: ["script-days", scripts.map((s) => s.moment_id).join()], enabled: scripts.some((s) => s.moment_id),
    queryFn: async () => {
      const ids = [...new Set(scripts.map((s) => s.moment_id).filter(Boolean))] as string[];
      const { data } = await supabase.from("content_moments").select("id,title,date").in("id", ids);
      return Object.fromEntries((data ?? []).map((m) => [m.id, { title: m.title, date: m.date }])) as Record<string, MomentInfo>;
    },
  });
  const dayNames: Record<string, string> = Object.fromEntries(Object.entries(days).map(([id, m]) => [id, `${m.title}${m.date ? ` · ${fmt(m.date)}` : ""}`]));
  const used = scope === "client" && canEdit ? usedScripts(scripts, days) : [];
  const formClient = edit?.client_id ?? null;
  const { data: moments = [] } = useQuery({
    queryKey: ["script-moments", formClient], enabled: !!formClient,
    queryFn: async () => (await supabase.from("content_moments").select("id,title,date").eq("client_id", formClient!).order("date", { ascending: false })).data ?? [],
  });

  const shown = useMemo(() => filterScripts(scripts, q, scope === "hibe" ? clientFilter : "all"), [scripts, q, clientFilter, scope]);
  const sel = shown.find((s) => s.id === selId) ?? shown[0] ?? null;
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";

  const save = async () => {
    if (!edit?.client_id || !edit.title?.trim()) return toast.error("Kies een klant en vul een titel in");
    const row = { client_id: edit.client_id, title: edit.title.trim(), body: edit.body ?? "", link: edit.link?.trim() || null,
      moment_id: edit.moment_id || null, updated_at: new Date().toISOString() };
    const res = edit.id ? await supabase.from("scripts").update(row).eq("id", edit.id).select().single()
      : await supabase.from("scripts").insert(row).select().single();
    if (res.error) return toast.error("Opslaan lukt niet");
    toast.success("Script opgeslagen"); setSelId(res.data.id); setEdit(null);
    qc.invalidateQueries({ queryKey: ["scripts"] });
  };
  const remove = async (s: Script) => {
    if (!confirm(`"${s.title}" verwijderen?`)) return;
    const { error } = await supabase.from("scripts").delete().eq("id", s.id);
    if (error) return toast.error("Verwijderen lukt niet");
    setSelId(null); qc.invalidateQueries({ queryKey: ["scripts"] });
  };
  const toggleShare = async (s: Script) => {
    const { error } = await supabase.from("scripts").update({ shared_with_client: !s.shared_with_client }).eq("id", s.id);
    if (error) return toast.error("Aanpassen lukt niet");
    toast.success(s.shared_with_client ? "Script teruggehaald" : "Script naar klant gestuurd");
    qc.invalidateQueries({ queryKey: ["scripts"] });
  };
  const readFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2e6) return toast.error("Bestand is te groot");
    const text = await f.text();
    setEdit((e) => ({ ...e, body: text, title: e?.title || f.name.replace(/\.[^.]+$/, "") }));
  };
  const newScript = () => setEdit({ client_id: scope === "client" ? clientId ?? undefined : clientFilter !== "all" ? clientFilter : undefined, shared_with_client: false, body: "" });

  return (
    <div className="space-y-4">
      <PageHeader title="Scripts" action={canEdit ? <PrimaryAction icon={Plus} onClick={newScript}>Nieuw script</PrimaryAction> : undefined} />
      {used.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Kennisbank: al gebruikt op contentdagen</h2>
          <ul className="mt-2 divide-y divide-border">
            {used.map(({ script: s, moment }) => (
              <li key={s.id}><button onClick={() => setSelId(s.id)} className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm hover:text-foreground">
                <span className="font-medium">{s.title}</span>
                <span className="shrink-0 text-muted-foreground">{moment.title} · {fmt(moment.date!)}</span>
              </button></li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek in titels en tekst voor inspiratie…" className="pl-9" />
        </div>
        {canEdit && <Button variant="outline" onClick={() => setIdeas(true)}><Sparkles className="h-4 w-4" />Ideeën genereren</Button>}
        {scope === "hibe" && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle klanten</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">{scripts.length ? "Geen scripts gevonden" : "Nog geen scripts"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{canEdit ? "Plak of upload een script en koppel het aan een klant." : "Zodra HIBE een script naar je stuurt, staat het hier."}</p>
          {canEdit && <Button className="mt-4" onClick={newScript}><Plus className="h-4 w-4" />Nieuw script</Button>}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <ul className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
            {shown.map((s) => (
              <li key={s.id}>
                <button onClick={() => setSelId(s.id)} className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${sel?.id === s.id ? "bg-accent" : "hover:bg-muted"}`}>
                  <p className="truncate font-semibold">{s.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {scope === "hibe" && <Tag>{clientName(s.client_id)}</Tag>}
                    <span>{fmt(s.created_at)}</span>
                    {canEdit && s.shared_with_client && <span>· naar klant gestuurd</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {sel && (
            <article className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{sel.title}</h2>
                  <p className="text-sm text-muted-foreground">{clientName(sel.client_id)} · {fmt(sel.created_at)}</p>
                  {sel.moment_id && dayNames[sel.moment_id] && <p className="mt-1"><Tag>Draaidag: {dayNames[sel.moment_id]}</Tag></p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(sel.body); toast.success("Gekopieerd"); }}><Copy className="h-4 w-4" />Kopieer</Button>
                  {sel.link && <Button variant="outline" size="sm" asChild><a href={sel.link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Link</a></Button>}
                  {canEdit && <>
                    <Button variant="outline" size="sm" onClick={() => toggleShare(sel)}>{sel.shared_with_client ? <><EyeOff className="h-4 w-4" />Terughalen bij klant</> : <><Send className="h-4 w-4" />Stuur naar klant</>}</Button>
                    <Button variant="outline" size="sm" onClick={() => setEdit(sel)}>Bewerken</Button>
                    <Button variant="ghost" size="sm" aria-label="Verwijderen" onClick={() => remove(sel)}><Trash2 className="h-4 w-4" /></Button>
                  </>}
                </div>
              </div>
              <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed">{sel.body || "Geen tekst."}</pre>
            </article>
          )}
        </div>
      )}

      {canEdit && <ScriptIdeas open={ideas} onOpenChange={setIdeas} initialClient={scope === "client" ? clientId : clientFilter !== "all" ? clientFilter : null} />}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Script bewerken" : "Nieuw script"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Klant</Label>
                  <Select value={edit.client_id ?? ""} onValueChange={(v) => setEdit({ ...edit, client_id: v, moment_id: null })} disabled={scope === "client"}>
                    <SelectTrigger><SelectValue placeholder="Kies klant" /></SelectTrigger>
                    <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Draaidag (optioneel)</Label>
                  <Select value={edit.moment_id ?? NONE} onValueChange={(v) => setEdit({ ...edit, moment_id: v === NONE ? null : v })} disabled={!edit.client_id}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={NONE}>Geen</SelectItem>
                      {moments.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}{m.date ? ` · ${fmt(m.date)}` : ""}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
              <div><Label>Titel</Label><Input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} maxLength={200} /></div>
              <div>
                <div className="flex items-center justify-between"><Label>Script</Label>
                  <label className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <Upload className="h-4 w-4" />Upload tekstbestand
                    <input type="file" accept=".txt,.md,text/plain" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
                  </label></div>
                <Textarea value={edit.body ?? ""} onChange={(e) => setEdit({ ...edit, body: e.target.value })} rows={12} placeholder="Plak hier het script…" />
              </div>
              <div><Label>Link (optioneel, bijv. Google Docs)</Label><Input value={edit.link ?? ""} onChange={(e) => setEdit({ ...edit, link: e.target.value })} placeholder="https://" /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEdit(null)}>Annuleren</Button><Button onClick={save}>Opslaan</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
