import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, Upload, MessageSquareWarning, Film, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useClient } from "@/context/ClientContext";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { useClientLogos, ClientMark } from "@/components/videos/parts";
import { validVideos } from "@/components/videos/UploadDialog";
import { startUpload, useUploads } from "@/lib/uploadStore";
import { Edit, EditStatus, EDIT_STATUSES, EDIT_STATUS_LABEL, EditFilters, filterEdits, parseTitles, progressLabel, statusAfterAssign } from "@/lib/edits";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const db = supabase as any;
type Member = { id: string; name: string; avatar_url: string | null };
type Row = Edit & { video?: { status: string } | null };

function useEdits() {
  return useQuery({
    queryKey: ["edits"],
    queryFn: async () => {
      const { data, error } = await db.from("edits").select("*, video:video_items(status)").order("created_at");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
}
function useTeam() {
  return useQuery({
    queryKey: ["hibe-team"],
    staleTime: 600_000,
    queryFn: async () => {
      const [{ data: roles }, { data: users }] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
        supabase.from("users").select("id,email,full_name,avatar_url"),
      ]);
      const ids = new Set((roles ?? []).map((r) => r.user_id));
      return (users ?? []).filter((u) => ids.has(u.id)).map((u) => ({ id: u.id, name: u.full_name || u.email.split("@")[0], avatar_url: u.avatar_url })) as Member[];
    },
  });
}

const KEY = "hibe.edits.filters";
const DEF: EditFilters = { client: "all", editor: "all", status: "all", mine: false, showDelivered: false };
function useFilters() {
  const [f, setF] = useState<EditFilters>(() => { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return DEF; } });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(f)); }, [f]);
  return [f, (p: Partial<EditFilters>) => setF((o) => ({ ...o, ...p }))] as const;
}

function Avatar({ m, size = 24 }: { m?: Member; size?: number }) {
  if (!m) return <span className="shrink-0 rounded-full border border-dashed border-border" style={{ width: size, height: size }} />;
  if (m.avatar_url) return <img src={m.avatar_url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background" style={{ width: size, height: size }}>{m.name.slice(0, 1).toUpperCase()}</span>;
}

const STATUS_CLS: Record<EditStatus, string> = {
  assign: "bg-warning/15 text-warning", todo: "bg-muted text-foreground", editing: "bg-foreground text-background", on_hold: "bg-muted text-muted-foreground", delivered: "bg-lime text-lime-foreground",
};
const fmtDeadline = (d: string) => new Date(d + "T00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
const overdue = (e: Edit) => !!e.deadline && e.status !== "delivered" && new Date(e.deadline + "T23:59") < new Date();

export default function HibeEdits() {
  const { clients } = useClient();
  const me = ((UserAuth() as any)?.user?.id as string) ?? null;
  const qc = useQueryClient();
  const logos = useClientLogos();
  const { data: edits = [], isLoading } = useEdits();
  const { data: team = [] } = useTeam();
  const [f, setF] = useFilters();
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [deliver, setDeliver] = useState<Row | null>(null);
  const [open, setOpen] = useState<Row | null>(null);
  const member = (id: string | null) => team.find((t) => t.id === id);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  const refresh = () => qc.invalidateQueries({ queryKey: ["edits"] });

  const update = async (e: Row, p: Partial<Edit>) => {
    const next = "editor_id" in p ? { ...p, status: p.status ?? statusAfterAssign(e.status, p.editor_id ?? null) } : p;
    qc.setQueryData<Row[]>(["edits"], (l) => l?.map((x) => (x.id === e.id ? { ...x, ...next } : x)));
    const { error } = await db.from("edits").update(next).eq("id", e.id);
    if (error) toast.error(error.message);
    refresh();
  };

  const visible = filterEdits(edits, f, me) as Row[];
  const groups = useMemo(() => {
    const ids = [...new Set(visible.map((e) => e.client_id))];
    return ids.map((id) => ({ id, name: clientName(id), rows: visible.filter((e) => e.client_id === id), all: edits.filter((e) => e.client_id === id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visible, edits, clients]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <PageHeader title="Edits" action={<PrimaryAction icon={Plus} onClick={() => setCreating(true)}>Nieuwe edit</PrimaryAction>} />
      <div className="flex flex-wrap items-center gap-2">
        <FSelect label="Klant" value={f.client} onChange={(v) => setF({ client: v })} options={[["all", "Alle klanten"], ...clients.map((c) => [c.id, c.name] as [string, string])]} />
        <FSelect label="Editor" value={f.editor} onChange={(v) => setF({ editor: v })} options={[["all", "Alle editors"], ["none", "Geen editor"], ...team.map((t) => [t.id, t.name] as [string, string])]} />
        <FSelect label="Status" value={f.status} onChange={(v) => setF({ status: v })} options={[["all", "Alle statussen"], ...EDIT_STATUSES.map((s) => [s, EDIT_STATUS_LABEL[s]] as [string, string])]} />
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.mine} onCheckedChange={(v) => setF({ mine: v })} />Alleen mijn edits</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.showDelivered} onCheckedChange={(v) => setF({ showDelivered: v })} />Toon ingeleverd</label>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Laden…</p> : groups.length === 0 ? (
        <div className="card flex flex-col items-start gap-3 p-6 text-sm text-muted-foreground">
          {edits.length ? "Geen edits voor deze filters." : "Nog geen edits. Plak een lijst titels om de montageplanning te starten."}
          {!edits.length && <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" />Nieuwe edit</Button>}
        </div>
      ) : groups.map((g) => (
        <section key={g.id} className="card overflow-hidden p-0">
          <button onClick={() => setClosed((c) => ({ ...c, [g.id]: !c[g.id] }))} aria-expanded={!closed[g.id]} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", closed[g.id] && "-rotate-90")} />
            <ClientMark id={g.id} name={g.name} url={logos[g.id]} size={28} />
            <span className="min-w-0 flex-1 truncate font-semibold">{g.name}</span>
            <span className="shrink-0 text-xs tabular text-muted-foreground">{progressLabel(g.all)}</span>
          </button>
          {!closed[g.id] && (
            <ul className="divide-y divide-border border-t border-border">
              {g.rows.map((e) => (
                <li key={e.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 md:grid-cols-[minmax(0,1fr)_180px_170px_80px_120px]">
                  <div className="col-span-2 flex min-w-0 items-center gap-2 md:col-span-1">
                    <button onClick={() => setOpen(e)} className="min-w-0 truncate text-left text-sm font-medium hover:underline">{e.title}</button>
                    {e.video?.status === "feedback" && e.video_item_id && (
                      <Link to={`/hibe/videos/${e.video_item_id}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"><MessageSquareWarning className="h-3 w-3" />Feedback</Link>
                    )}
                    {e.video_item_id && e.video?.status !== "feedback" && <Link to={`/hibe/videos/${e.video_item_id}`} aria-label="Open video" className="shrink-0 text-muted-foreground hover:text-foreground"><Film className="h-3.5 w-3.5" /></Link>}
                  </div>
                  <Select value={e.editor_id ?? "none"} onValueChange={(v) => update(e, { editor_id: v === "none" ? null : v })}>
                    <SelectTrigger aria-label={`Editor voor ${e.title}`} className="h-8 border-transparent px-2 hover:border-border"><span className="flex min-w-0 items-center gap-2"><Avatar m={member(e.editor_id)} size={22} /><span className="truncate text-sm">{member(e.editor_id)?.name ?? "Geen editor"}</span></span></SelectTrigger>
                    <SelectContent><SelectItem value="none">Geen editor</SelectItem>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={e.status} onValueChange={(v) => update(e, { status: v as EditStatus })}>
                    <SelectTrigger aria-label={`Status voor ${e.title}`} className="h-8 w-fit border-transparent px-1 hover:border-border"><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_CLS[e.status])}>{EDIT_STATUS_LABEL[e.status]}</span></SelectTrigger>
                    <SelectContent>{EDIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{EDIT_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                  </Select>
                  <span className={cn("text-sm tabular", overdue(e) ? "font-medium text-destructive" : "text-muted-foreground")}>{e.deadline ? fmtDeadline(e.deadline) : "—"}</span>
                  {e.status === "delivered" ? <span className="text-right text-xs text-muted-foreground">Ingeleverd</span> :
                    <Button size="sm" variant="outline" onClick={() => setDeliver(e)} className="justify-self-end"><Upload className="mr-1 h-3.5 w-3.5" />Inleveren</Button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <NewEdits open={creating} onOpenChange={setCreating} defaultClient={f.client !== "all" ? f.client : ""} onDone={refresh} />
      {deliver && <DeliverDialog edit={deliver} uploader={deliver.editor_id ?? me ?? undefined} onClose={() => setDeliver(null)} onDone={refresh} />}
      {open && <EditDialog edit={open} onClose={() => setOpen(null)} onSave={async (p) => { await update(open, p); setOpen(null); }} onDelete={async () => { await db.from("edits").delete().eq("id", open.id); setOpen(null); refresh(); }} />}
    </div>
  );
}

function FSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-9 w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function NewEdits({ open, onOpenChange, defaultClient, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; defaultClient: string; onDone: () => void }) {
  const { clients } = useClient();
  const [client, setClient] = useState(defaultClient);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setClient(defaultClient); setText(""); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const titles = parseTitles(text);
  const save = async () => {
    setBusy(true);
    const { error } = await db.from("edits").insert(titles.map((title) => ({ client_id: client, title, status: "assign" })));
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${titles.length} edit${titles.length === 1 ? "" : "s"} toegevoegd`);
    onDone(); onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nieuwe edit</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Klant</Label>
            <Select value={client} onValueChange={setClient}><SelectTrigger aria-label="Klant"><SelectValue placeholder="Kies een klant" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="titles">Titels, één per regel</Label>
            <Textarea id="titles" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Reel lancering\nBehind the scenes\nInterview deel 1"} /></div>
        </div>
        <DialogFooter><Button disabled={!client || !titles.length || busy} onClick={save}>{titles.length > 1 ? `${titles.length} edits toevoegen` : "Edit toevoegen"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeliverDialog({ edit, uploader, onClose, onDone }: { edit: Row; uploader?: string; onClose: () => void; onDone: () => void }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useUploads().find((j) => j.id === jobId);
  const pick = (fl: FileList | null) => { if (fl) { const v = validVideos(fl); if (v[0]) setFile(v[0]); } };
  const go = () => {
    if (!file) return;
    setJobId(startUpload({ file, clientId: edit.client_id, title: edit.title, uploaderId: uploader, onDone: async (t) => {
      const { error } = await db.from("edits").update({ status: "delivered", video_item_id: t.item_id }).eq("id", edit.id);
      if (error) toast.error(error.message); else toast.success(`${edit.title} is ingeleverd en staat in Interne controle`);
      qc.invalidateQueries({ queryKey: ["video-items"] }); onDone(); onClose();
    } }));
  };
  const busy = job?.state === "uploading";
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Inleveren: {edit.title}</DialogTitle></DialogHeader>
        {job ? (
          <div className="space-y-2">
            <p className="truncate text-sm">{file?.name}</p>
            <Progress value={Math.round(job.progress * 100)} aria-label="Uploadvoortgang" />
            <p className="text-xs tabular text-muted-foreground">{job.state === "error" ? `Mislukt: ${job.error}` : job.state === "done" ? "Klaar" : `${Math.round(job.progress * 100)}% — je kunt dit venster sluiten, de upload loopt door.`}</p>
          </div>
        ) : (
          <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
            className={cn("flex h-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground hover:bg-muted", over && "border-foreground bg-muted")}>
            <Upload className="h-5 w-5" />
            {file ? <span className="font-medium text-foreground">{file.name}</span> : "Sleep het videobestand hierheen of klik om te kiezen"}
            <input type="file" accept="video/*" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        <DialogFooter>
          {job?.state === "error" ? <Button onClick={() => setJobId(null)}>Opnieuw proberen</Button> :
            <Button disabled={!file || !!job} onClick={go}>{busy ? "Bezig met uploaden…" : "Uploaden en inleveren"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ edit, onClose, onSave, onDelete }: { edit: Row; onClose: () => void; onSave: (p: Partial<Edit>) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(edit.title);
  const [deadline, setDeadline] = useState(edit.deadline ?? "");
  const [notes, setNotes] = useState(edit.notes ?? "");
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit bewerken</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="et">Titel</Label><Input id="et" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ed">Deadline</Label><Input id="ed" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="en">Notities</Label><Textarea id="en" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={onDelete}><Trash2 className="mr-1 h-4 w-4" />Verwijderen</Button>
          <Button disabled={!title.trim()} onClick={() => onSave({ title: title.trim(), deadline: deadline || null, notes: notes.trim() || null })}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
