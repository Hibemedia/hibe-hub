import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Upload, Copy, ExternalLink, EyeOff, Send, FileText, Sparkles, Download, ChevronDown } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ScriptIdeas } from "@/components/ScriptIdeas";
import { ScriptPdfImport } from "@/components/ScriptPdfImport";
import { ScriptEditPanel, useScriptEdits, createEditForScript } from "@/components/ScriptEditPanel";
import { scriptsDayPdf } from "@/lib/scripts-pdf";
import { filterScripts, groupScriptsByDay, dayBlockOpen, usedScripts, type MomentInfo, type Script } from "@/lib/scripts";

const fmt = (d: string) => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const NONE = "__none";

/** scope "hibe": all clients (/hibe/scripts). scope "client": selected client only. */
export default function Scripts({ scope = "client" }: { scope?: "hibe" | "client" }) {
  const { isAdmin, clients, clientId, ready } = useClient();
  const viewAs = useViewAs();
  const canEdit = isAdmin && !viewAs;
  const qc = useQueryClient();
  const [workflow, setWorkflow] = useState<"new" | "shoot">("new");
  const [q, setQ] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [selId, setSelId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState(false);
  const [pdfIn, setPdfIn] = useState(false);
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

  const shown = useMemo(() => {
    const list = filterScripts(scripts, q, scope === "hibe" ? clientFilter : "all")
      .filter((s) => !canEdit || (workflow === "shoot" ? !!s.moment_id : !s.moment_id))
      .filter((s) => !canEdit || workflow !== "shoot" || dayFilter === "all" || (dayFilter === NONE ? !s.moment_id : s.moment_id === dayFilter));
    const dayDate = (s: Script) => (s.moment_id ? days[s.moment_id]?.date ?? "0" : "");
    return list.sort((a, b) => dayDate(b).localeCompare(dayDate(a)) || (a.moment_id ?? "").localeCompare(b.moment_id ?? "") || (a.moment_id ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)));
  }, [scripts, q, clientFilter, scope, dayFilter, days, canEdit, workflow]);
  const dayOptions = Object.entries(days).filter(([id]) => scripts.some((s) => s.moment_id === id && (scope === "client" || clientFilter === "all" || s.client_id === clientFilter)))
    .sort((a, b) => (b[1].date ?? "").localeCompare(a[1].date ?? ""));
  const { data: editMap = {} } = useScriptEdits(canEdit ? scripts.filter((s) => s.moment_id).map((s) => s.id) : []);
  const sel = shown.find((s) => s.id === selId) ?? shown[0] ?? null;
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";

  const collapsible = canEdit && workflow === "shoot";
  const filterActive = q.trim() !== "" || (scope === "hibe" && clientFilter !== "all") || dayFilter !== "all";
  const blockOpts = { collapsible, filterActive, selectedMomentId: sel?.moment_id };
  const groups = useMemo(() => groupScriptsByDay(shown, dayNames), [shown, dayNames]);
  const allDaysOpen = groups.every((g) => dayBlockOpen(g.id, openDays, blockOpts));
  const toggleDay = (id: string | null) => setOpenDays((m) => ({ ...m, [id ?? "__none"]: !dayBlockOpen(id, m, blockOpts) }));
  const toggleAllDays = () => setOpenDays(Object.fromEntries(groups.map((g) => [g.id ?? "__none", !allDaysOpen])));

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
  const byDay = useMemo(() => {
    const m = new Map<string, Script[]>();
    for (const s of scripts) if (s.moment_id && days[s.moment_id] && (scope === "client" || clientFilter === "all" || s.client_id === clientFilter)) m.set(s.moment_id, [...(m.get(s.moment_id) ?? []), s]);
    return [...m.entries()].map(([id, list]) => ({ id, moment: days[id], client: list[0].client_id, list: [...list].sort((a, b) => a.created_at.localeCompare(b.created_at)) }))
      .sort((a, b) => clientName(a.client).localeCompare(clientName(b.client)) || (b.moment.date ?? "").localeCompare(a.moment.date ?? ""));
  }, [scripts, days, clientFilter, scope, clients]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = new Date().toISOString().slice(0, 10);
  const downloadDay = async (g: (typeof byDay)[number]) => {
    try {
      const blob = await scriptsDayPdf({ client: clientName(g.client), day: g.moment.title, date: g.moment.date, scripts: g.list });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `Scripts ${clientName(g.client)} ${g.moment.title} ${g.moment.date ?? ""}.pdf`.replace(/[\\/:*?"<>|]/g, "").trim();
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { toast.error("PDF maken lukt niet"); }
  };
  const makeEdits = async (g: (typeof byDay)[number]) => {
    const todo = g.list.filter((s) => !editMap[s.id]);
    try { for (const s of todo) await createEditForScript(s, g.moment.date, null, null); toast.success(`${todo.length} edits aangemaakt`); }
    catch { toast.error("Niet alle edits zijn aangemaakt"); }
    qc.invalidateQueries({ queryKey: ["edits"] });
  };
  const newScript = () => setEdit({ client_id: scope === "client" ? clientId ?? undefined : clientFilter !== "all" ? clientFilter : undefined, shared_with_client: false, body: "" });
  const changeWorkflow = (value: string) => {
    setWorkflow(value as "new" | "shoot");
    setDayFilter("all");
    setOpenDays({});
    setSelId(null);
    setQ("");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Scripts" action={canEdit ? workflow === "new"
        ? <PrimaryAction icon={Plus} onClick={newScript}>Nieuw script</PrimaryAction>
        : <PrimaryAction icon={Upload} onClick={() => setPdfIn(true)}>PDF draaidag uploaden</PrimaryAction> : undefined} />
      {canEdit && (
        <div className="space-y-2">
          <Tabs value={workflow} onValueChange={changeWorkflow}>
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="new">Nieuwe scripts</TabsTrigger>
              <TabsTrigger value="shoot">Draaidag verwerken</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">
            {workflow === "new"
              ? "Bedenk en schrijf nieuwe scripts en stuur ze naar de klant voor goedkeuring."
              : "Upload de PDF van een afgelopen draaidag, koppel per script de video en verdeel de edits."}
          </p>
        </div>
      )}
      {workflow === "new" && used.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Kennisbank: al gebruikt op contentdagen</h2>
          <ul className="mt-2 divide-y divide-border">
            {used.map(({ script: s, moment }) => (
              <li key={s.id}><button onClick={() => { setWorkflow("shoot"); setQ(""); setSelId(s.id); }} className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm hover:text-foreground">
                <span className="font-medium">{s.title}</span>
                <span className="shrink-0 text-muted-foreground">{moment.title} · {fmt(moment.date!)}</span>
              </button></li>
            ))}
          </ul>
        </section>
      )}
      {canEdit && workflow === "shoot" && byDay.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Scripts per draaidag</h2>
          <p className="text-sm text-muted-foreground">Voeg alle scripts van een draaidag samen in één PDF, genummerd vanaf script 1.</p>
          <ul className="mt-2 divide-y divide-border">
            {byDay.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{g.moment.title}{g.moment.date ? ` · ${fmt(g.moment.date)}` : ""}</p>
                  <p className="text-muted-foreground">{scope === "hibe" ? `${clientName(g.client)} · ` : ""}{g.list.length} {g.list.length === 1 ? "script" : "scripts"} · {g.list.filter((s) => editMap[s.id]?.editor_id).length} met editor{g.moment.date && g.moment.date < today ? " · draaidag voorbij" : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDayFilter(g.id)}>Bekijk</Button>
                  {g.list.some((s) => !editMap[s.id])
                    ? <Button size="sm" variant="outline" onClick={() => makeEdits(g)}>Edits maken ({g.list.filter((s) => !editMap[s.id]).length})</Button>
                    : <span className="self-center text-xs text-muted-foreground">alle edits aangemaakt</span>}
                  <Button size="sm" variant="outline" onClick={() => downloadDay(g)}><Download className="h-4 w-4" />PDF</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={canEdit && workflow === "shoot" ? "Zoek scripts van draaidagen…" : "Zoek in titels en tekst voor inspiratie…"} className="pl-9" />
        </div>
        {canEdit && workflow === "new" && <Button variant="outline" onClick={() => setIdeas(true)}><Sparkles className="h-4 w-4" />Ideeën genereren</Button>}
        {scope === "hibe" && (
          <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setDayFilter("all"); setSelId(null); }}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle klanten</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {canEdit && workflow === "shoot" && (
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="w-[220px]" aria-label="Draaidag"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle draaidagen</SelectItem>
              {dayOptions.map(([id, m]) => <SelectItem key={id} value={id}>{m.title}{m.date ? ` · ${fmt(m.date)}` : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">{q || clientFilter !== "all" || dayFilter !== "all" ? "Geen scripts gevonden" : canEdit && workflow === "shoot" ? "Nog geen draaidagscripts" : "Nog geen nieuwe scripts"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {!canEdit ? "Zodra HIBE een script naar je stuurt, staat het hier." : workflow === "shoot"
              ? "Upload de PDF met goedgekeurde scripts van een afgelopen draaidag. Daarna koppel je video's en editors."
              : "Genereer ideeën of maak zelf een script. Daarna stuur je het naar de klant voor goedkeuring."}
          </p>
          {canEdit && !q && clientFilter === "all" && dayFilter === "all" && (workflow === "shoot"
            ? <Button className="mt-4" onClick={() => setPdfIn(true)}><Upload className="h-4 w-4" />PDF draaidag uploaden</Button>
            : <div className="mt-4 flex flex-wrap justify-center gap-2"><Button onClick={() => setIdeas(true)}><Sparkles className="h-4 w-4" />Ideeën genereren</Button><Button variant="outline" onClick={newScript}><Plus className="h-4 w-4" />Nieuw script</Button></div>)}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="min-w-0 space-y-2">
            {collapsible && !filterActive && groups.length > 1 && (
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">{groups.length} draaidagen</p>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={toggleAllDays}>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${allDaysOpen ? "rotate-180" : ""}`} />
                  {allDaysOpen ? "Alles inklappen" : "Alles uitklappen"}
                </Button>
              </div>
            )}
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
              {groups.map((g) => {
                const open = dayBlockOpen(g.id, openDays, blockOpts);
                const holdsSel = g.list.some((s) => s.id === sel?.id);
                return (
                  <li key={g.id ?? "__none"}>
                    {collapsible ? (
                      <button onClick={() => toggleDay(g.id)} aria-expanded={open} aria-current={holdsSel ? "true" : undefined} className="flex w-full items-center gap-2 rounded-lg px-3 pb-1 pt-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
                        <span className={`min-w-0 truncate ${holdsSel ? "text-foreground" : ""}`}>{g.label}</span>
                        {holdsSel && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime" aria-hidden />}
                        <span className="ml-auto shrink-0 text-[11px] font-normal normal-case tabular-nums">{g.list.length}</span>
                      </button>
                    ) : (
                      <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
                    )}
                    {open && g.list.map((s) => (
                      <button key={s.id} onClick={() => setSelId(s.id)} className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${sel?.id === s.id ? "bg-accent" : "hover:bg-muted"}`}>
                        <p className="truncate font-semibold">{s.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {scope === "hibe" && <Tag>{clientName(s.client_id)}</Tag>}
                          <span>{fmt(s.created_at)}</span>
                          {canEdit && s.shared_with_client && <span>· naar klant gestuurd</span>}
                          {canEdit && editMap[s.id] && <span>· edit{editMap[s.id].editor_id ? " toegewezen" : ""}</span>}
                        </div>
                      </button>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
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
              {canEdit && sel.moment_id && <ScriptEditPanel script={sel} shootDate={days[sel.moment_id]?.date ?? null} />}
              <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed">{sel.body || "Geen tekst."}</pre>
            </article>
          )}
        </div>
      )}

      {canEdit && pdfIn && <ScriptPdfImport open={pdfIn} onOpenChange={setPdfIn} clients={clients} initialClient={scope === "client" ? clientId : clientFilter !== "all" ? clientFilter : null} />}
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
                {workflow === "shoot" && <div><Label>Draaidag</Label>
                  <Select value={edit.moment_id ?? ""} onValueChange={(v) => setEdit({ ...edit, moment_id: v })} disabled={!edit.client_id}>
                    <SelectTrigger><SelectValue placeholder="Kies draaidag" /></SelectTrigger>
                    <SelectContent>
                      {moments.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}{m.date ? ` · ${fmt(m.date)}` : ""}</SelectItem>)}</SelectContent>
                  </Select></div>}
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
