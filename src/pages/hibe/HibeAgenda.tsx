import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useClient } from "@/context/ClientContext";
import { useTeamMembers } from "@/hooks/useChat";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AgendaEntry, AgendaKind, DAY_CAPACITY, absentOn, entriesOn, monthGrid, personDayLoad, shootRow, teamDayLoad, workWeek, ymd } from "@/lib/agenda";
import { TaskDialog, TaskFields, blankTask, saveTask, taskToForm, type TaskForm } from "@/components/TaskDialog";
import { AgendaControls, useAgendaFilters } from "@/components/agenda/AgendaControls";
import { AgendaDetails } from "@/components/agenda/AgendaDetails";
import { AgendaDayItems } from "@/components/agenda/AgendaDayItems";
import { filterAgendaEntries } from "@/lib/agenda-filters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const db = supabase as any;
const KIND_LABEL: Record<AgendaKind, string> = { shoot: "Draaidag", meeting: "Meeting", vacation: "Vrij", task: "Taak", edit: "Montage" };
const KIND_CLS: Record<AgendaKind, string> = {
  shoot: "agenda-type-item agenda-shoot",
  meeting: "agenda-type-item agenda-meeting",
  vacation: "agenda-type-item agenda-vacation",
  task: "agenda-type-item agenda-task",
  edit: "agenda-type-item agenda-edit",
};
const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

type Ev = { id: string; kind: "meeting" | "vacation"; title: string; start_date: string; end_date: string; start_time: string | null; end_time: string | null; location: string | null; notes: string | null; person_id: string | null; attendees: { user_id: string }[] };
type Form = { id?: string; kind: AgendaKind; title: string; start_date: string; end_date: string; start_time: string; end_time: string; location: string; notes: string; people: string[]; client_id: string };

function useAgenda(from: string, to: string) {
  return useQuery({
    queryKey: ["agenda", from, to],
    queryFn: async () => {
      const [ev, mo, tk, ed] = await Promise.all([
        db.from("calendar_events").select("*, attendees:calendar_attendees(user_id)").lte("start_date", to).gte("end_date", from),
        db.from("content_moments").select("id,title,date,start_time,location,notes,client_id,status,crew:moment_crew(user_id)").gte("date", from).lte("date", to),
        db.from("tasks").select("*").not("due_date", "is", null).gte("due_date", from).lte("due_date", to),
        db.from("edits").select("id,title,client_id,editor_id,status,planned_date,notes").not("planned_date", "is", null).neq("status", "delivered").gte("planned_date", from).lte("planned_date", to),
      ]);
      if (ev.error) throw ev.error;
      if (mo.error) throw mo.error;
      if (tk.error) throw tk.error;
      if (ed.error) throw ed.error;
      return { events: (ev.data ?? []) as Ev[], moments: (mo.data ?? []) as any[], tasks: (tk.data ?? []) as any[], edits: (ed.data ?? []) as any[] };
    },
  });
}

export default function HibeAgenda() {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [weekRef, setWeekRef] = useState(now);
  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const week = useMemo(() => workWeek(weekRef), [weekRef]);
  const from = view === "week" ? ymd(week[0]) : ymd(grid[0]), to = view === "week" ? ymd(week[4]) : ymd(grid[41]);
  const { data, isLoading, error: agendaError } = useAgenda(from, to);
  const { data: team = [] } = useTeamMembers();
  const { clients } = useClient();
  const me = ((UserAuth() as any)?.user?.id as string) ?? "";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const name = (id: string) => team.find((t) => t.id === id)?.name ?? "Teamlid";

  const allEntries: AgendaEntry[] = useMemo(() => [
    ...(data?.moments ?? []).filter((m) => m.date && m.status !== "cancelled" && m.status !== "geannuleerd").map((m) => ({
      id: m.id, kind: "shoot" as const, clientId: m.client_id, location: m.location, notes: m.notes, start: m.date, end: m.date, time: m.start_time?.slice(0, 5),
      title: `${clients.find((c) => c.id === m.client_id)?.name ?? "Klant"} · ${m.title}`, people: (m.crew ?? []).map((c: any) => c.user_id),
    })),
    ...(data?.events ?? []).map((e) => ({
      id: e.id, kind: e.kind, location: e.location, notes: e.notes, endTime: e.end_time?.slice(0, 5), start: e.start_date, end: e.end_date, time: e.start_time?.slice(0, 5),
      title: e.kind === "vacation" ? `${e.person_id ? name(e.person_id) : ""} ${e.title}`.trim() : e.title,
      people: e.kind === "vacation" ? (e.person_id ? [e.person_id] : []) : e.attendees.map((a) => a.user_id),
    })),
    ...(data?.edits ?? []).map((e) => ({
      id: e.id, kind: "edit" as const, clientId: e.client_id, notes: e.notes, start: e.planned_date, end: e.planned_date,
      title: `${clients.find((c) => c.id === e.client_id)?.name ?? "Klant"} · ${e.title}`, people: e.editor_id ? [e.editor_id] : [],
    })),
    ...(data?.tasks ?? []).filter((t) => !t.done_at).map((t) => ({
      id: t.id, kind: "task" as const, clientId: t.client_id, notes: t.notes, start: t.due_date, end: t.due_date, time: t.due_time?.slice(0, 5),
      title: t.assignee_id === me ? t.title : `${name(t.assignee_id)}: ${t.title}`, people: [t.assignee_id],
    })),
  ], [data, clients, team, me]);
  const { filters, setFilters } = useAgendaFilters(me);
  const entries = filterAgendaEntries(allEntries, filters, me);
  const visibleTeam = team.filter((t) => filters.who === "everyone" || (filters.who === "me" ? t.id === me : filters.people.includes(t.id)));
  const [selected, setSelected] = useState<AgendaEntry | null>(null);
  const [task, setTask] = useState<TaskForm | null>(null);
  const [taskEdit, setTaskEdit] = useState<TaskForm | null>(null);

  const blank = (day: string, kind: Form["kind"] = "meeting"): Form => ({ kind, title: kind === "vacation" ? "Vakantie" : "", start_date: day, end_date: day, start_time: kind === "meeting" ? "10:00" : "", end_time: kind === "meeting" ? "11:00" : "", location: "", notes: "", people: kind === "vacation" ? [me] : [], client_id: "" });
  const editEntry = (e: AgendaEntry) => {
    if (e.kind === "shoot") return nav("/hibe/contentmomenten");
    if (e.kind === "edit") return nav("/hibe/edits");
    if (e.kind === "task") { const t = data?.tasks.find((x) => x.id === e.id); if (t) setTaskEdit(taskToForm(t)); return; }
    const ev = data?.events.find((x) => x.id === e.id); if (!ev) return;
    setForm({ id: ev.id, kind: ev.kind, title: ev.title, start_date: ev.start_date, end_date: ev.end_date, start_time: ev.start_time?.slice(0, 5) ?? "", end_time: ev.end_time?.slice(0, 5) ?? "", location: ev.location ?? "", notes: ev.notes ?? "", people: ev.kind === "vacation" ? (ev.person_id ? [ev.person_id] : []) : ev.attendees.map((a) => a.user_id), client_id: "" });
  };

  const open = (e: AgendaEntry) => setSelected(e);

  const warn = !!form && form.kind !== "vacation";
  const absent = warn ? absentOn(form.start_date, allEntries.filter((e) => e.id !== form.id)).filter((p) => form.people.includes(p)) : [];
  const busyShoot = warn ? allEntries.filter((e) => e.kind === "shoot" && e.start === form.start_date && e.people.some((p) => form.people.includes(p))) : [];

  const save = async () => {
    if (!form) return;
    if (form.kind === "task") {
      setSaving(true);
      if (!task) return;
      try { await saveTask({ ...task, due_date: task.due_date || form.start_date }, me); toast.success("Taak ingepland"); setForm(null); qc.invalidateQueries({ queryKey: ["agenda"] }); qc.invalidateQueries({ queryKey: ["tasks"] }); }
      catch (e: any) { toast.error(e.message ?? "Opslaan mislukt"); } finally { setSaving(false); }
      return;
    }
    if (!form.title.trim()) return toast.error("Geef een titel op");
    if (form.end_date < form.start_date) return toast.error("Einddatum ligt voor de begindatum");
    setSaving(true);
    try {
      if (form.kind === "shoot") {
        if (!form.client_id) return toast.error("Kies een klant");
        const { data: ins, error } = await db.from("content_moments").insert(shootRow({ title: form.title, client_id: form.client_id, date: form.start_date, start_time: form.start_time, location: form.location, notes: form.notes }, me)).select("id").single();
        if (error) throw error;
        const mid = (ins as any).id as string;
        if (form.people.length) {
          const { error: ce } = await db.from("moment_crew").insert(form.people.map((u) => ({ moment_id: mid, user_id: u, created_by: me || null })));
          if (ce) throw ce;
        }
        toast.success("Draaidag toegevoegd");
        setForm(null);
        qc.invalidateQueries({ queryKey: ["agenda"] });
        qc.invalidateQueries({ queryKey: ["content-moments"] });
        qc.invalidateQueries({ queryKey: ["moment-crew"] });
        return;
      }
      const row = { kind: form.kind, title: form.title.trim(), start_date: form.start_date, end_date: form.kind === "meeting" ? form.start_date : form.end_date, start_time: form.start_time || null, end_time: form.end_time || null, location: form.location || null, notes: form.notes || null, person_id: form.kind === "vacation" ? (form.people[0] ?? me) : null };
      let id = form.id;
      if (id) { const { error } = await db.from("calendar_events").update(row).eq("id", id); if (error) throw error; }
      else { const { data: ins, error } = await db.from("calendar_events").insert(row).select("id").single(); if (error) throw error; id = ins.id; }
      if (form.kind === "meeting") {
        const prev = data?.events.find((x) => x.id === id)?.attendees.map((a) => a.user_id) ?? [];
        const removed = prev.filter((p) => !form.people.includes(p));
        const added = form.people.filter((p) => !prev.includes(p));
        if (removed.length) await db.from("calendar_attendees").delete().eq("event_id", id).in("user_id", removed);
        if (added.length) { const { error } = await db.from("calendar_attendees").insert(added.map((u) => ({ event_id: id, user_id: u, seen_at: u === me ? new Date().toISOString() : null }))); if (error) throw error; }
      }
      toast.success("Opgeslagen");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["agenda"] });
      qc.invalidateQueries({ queryKey: ["agenda-invites"] });
    } catch (e: any) { toast.error(e.message ?? "Opslaan mislukt"); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!form?.id) return;
    const { error } = await db.from("calendar_events").delete().eq("id", form.id);
    if (error) return toast.error(error.message);
    setForm(null); qc.invalidateQueries({ queryKey: ["agenda"] });
  };

  const today = ymd(now);
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
  const shiftWeek = (d: number) => setWeekRef((w) => new Date(w.getFullYear(), w.getMonth(), w.getDate() + d * 7));
  const weekTitle = `${week[0].toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} – ${week[4].toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}`;
  const people = visibleTeam.map((t) => t.id);
  const unassigned = entries.filter((e) => e.kind === "edit" && e.people.length === 0);
  const shift = (d: number) => setCursor((c) => { const x = new Date(c.y, c.m + d, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
  const toggle = (id: string) => form && setForm({ ...form, people: form.kind === "vacation" ? [id] : form.people.includes(id) ? form.people.filter((p) => p !== id) : [...form.people, id] });

  return (
    <div className="space-y-4">
      <PageHeader title="Agenda" action={<PrimaryAction icon={Plus} onClick={() => setForm(blank(today))}>Nieuw item</PrimaryAction>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="agenda-segment" role="group" aria-label="Agendaweergave">
          {(["month", "week", "list"] as const).map((v) => <Button key={v} size="sm" variant="ghost" onClick={() => setView(v)} aria-pressed={view === v} className="agenda-segment-option px-3">{v === "month" ? "Maand" : v === "week" ? "Weekbezetting" : "Lijst"}</Button>)}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Vorige" onClick={() => view === "week" ? shiftWeek(-1) : shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Volgende" onClick={() => view === "week" ? shiftWeek(1) : shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          <h2 className="min-w-0 truncate text-sm font-semibold capitalize sm:text-lg">{view === "week" ? weekTitle : title}</h2>
          <Button variant="ghost" size="sm" onClick={() => { setCursor({ y: now.getFullYear(), m: now.getMonth() }); setWeekRef(new Date()); }}>Vandaag</Button>
        </div>
      </div>
      <AgendaControls filters={filters} onChange={setFilters} entries={allEntries} me={me} team={team} clients={clients} light />
      {isLoading && <p className="text-sm text-muted-foreground">Agenda laden…</p>}
      {agendaError && <p className="text-sm text-destructive">Agenda kon niet worden geladen.</p>}
      {view === "week" && <div className="overflow-x-auto rounded-[20px] border border-border bg-card">
        <div className="grid min-w-[760px] grid-cols-[160px_repeat(5,minmax(0,1fr))]">
          <div className="border-b border-r border-border p-2 text-xs font-medium uppercase text-muted-foreground">Bezetting</div>
          {week.map((d, i) => {
            const day = ymd(d); const t = teamDayLoad(people, day, entries); const pct = t.capacity ? Math.min(100, Math.round((t.load / t.capacity) * 100)) : 100;
            const tone = t.overloaded > 0 || pct > 85 ? "bg-warning" : pct >= 50 ? "bg-foreground" : "bg-lime";
            return (
              <div key={day} className={cn("border-b border-border p-2", i < 4 && "border-r", day === today && "bg-muted/50")}>
                <div className="flex items-baseline justify-between gap-2"><span className="text-sm font-semibold capitalize">{d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}</span><span className="text-xs tabular text-muted-foreground">{t.busy}/{t.available} bezet</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} /></div>
                {t.overloaded > 0 && <p className="mt-1 text-[11px] font-medium text-warning">{t.overloaded} {t.overloaded > 1 ? "personen" : "persoon"} overvol</p>}
              </div>
            );
          })}
          {visibleTeam.map((m) => <Fragment key={m.id}>
            <div className="flex min-w-0 items-center gap-2 border-b border-r border-border p-2"><UserAvatar userId={m.id} size={26} /><span className="truncate text-sm font-medium">{m.name}</span></div>
            {week.map((d, i) => {
              const day = ymd(d); const list = entriesOn(day, entries).filter((e) => e.people.includes(m.id)); const l = personDayLoad(m.id, day, entries);
              return (
                <div key={m.id + day} onClick={() => setForm({ ...blank(day), people: [m.id] })} className={cn("min-h-[64px] min-w-0 cursor-pointer space-y-0.5 border-b border-border p-1.5 hover:bg-muted/50", i < 4 && "border-r", l.level === "over" && "bg-warning/10")}>
                  <AgendaDayItems entries={list} onOpen={open} tones={KIND_CLS} />
                </div>
              );
            })}
          </Fragment>)}
        </div>
        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Werkdruk per persoon: draaidag 3, montage 2, meeting of taak 1 — meer dan {DAY_CAPACITY} per dag is overvol. Montages verschijnen op de montagedag die je bij een edit invult.{unassigned.length > 0 && ` ${unassigned.length} geplande montage${unassigned.length > 1 ? "s" : ""} zonder editor.`}</p>
      </div>}
      {view === "month" && <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium uppercase text-muted-foreground">
          {DAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const day = ymd(d); const list = entriesOn(day, entries); const out = d.getMonth() !== cursor.m;
            return (
              <div key={day} onClick={() => setForm(blank(day))} className={cn("min-h-[92px] min-w-0 cursor-pointer border-border p-1 sm:min-h-[112px] sm:p-1.5 hover:bg-muted/50", i % 7 !== 6 && "border-r", i < 35 && "border-b", (out || i % 7 > 4) && "bg-muted/30")}>
                <div className={cn("mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular", day === today && "bg-foreground font-semibold text-background", out && "text-muted-foreground/60")}>{d.getDate()}</div>
                <AgendaDayItems entries={list} onOpen={open} tones={KIND_CLS} />
              </div>
            );
          })}
        </div>
      </div>}

      {view === "list" && <div className="overflow-hidden rounded-xl border border-border bg-card">
        {grid.filter((d) => d.getMonth() === cursor.m && entriesOn(ymd(d), entries).length > 0).map((d) => <section key={ymd(d)} className="border-b border-border last:border-0">
          <h3 className="bg-muted/40 px-4 py-2 text-sm font-semibold capitalize">{d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}</h3>
          <div className="space-y-1 p-2">{entriesOn(ymd(d), entries).map((e) => <Button key={`${e.kind}:${e.id}`} variant="ghost" className="h-auto min-h-10 w-full justify-start gap-3 rounded-md text-left" onClick={() => open(e)}><span className={cn("shrink-0 rounded-md px-2 py-1 text-xs", KIND_CLS[e.kind])}>{KIND_LABEL[e.kind]}</span><span className="min-w-0 flex-1 truncate">{e.title}</span><span className="shrink-0 text-xs text-muted-foreground">{e.time || ""}</span></Button>)}</div>
        </section>)}
        {!isLoading && !grid.some((d) => d.getMonth() === cursor.m && entriesOn(ymd(d), entries).length > 0) && <p className="p-4 text-sm text-muted-foreground">Geen items voor deze selectie.</p>}
      </div>}
      <AgendaDetails entry={selected} onClose={() => setSelected(null)} onOpen={(e) => { setSelected(null); editEntry(e); }} clients={clients} team={team} />

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg">
          {form && <>
            <DialogHeader><DialogTitle>{form.id ? "Bewerken" : "Nieuw in de agenda"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {!form.id && <div className="flex flex-wrap gap-2">
                {(["shoot", "meeting", "vacation", "task"] as const).map((k) => <Button variant="outline" size="sm" key={k} onClick={() => { setForm({ ...blank(form.start_date, k) }); if (k === "task") setTask(blankTask(me, form.start_date)); }} className={cn("rounded-md", form.kind === k && "bg-foreground text-background")}>{k === "shoot" ? "Draaidag" : k === "meeting" ? "Meeting" : k === "task" ? "Taak" : "Vakantie / vrij"}</Button>)}
              </div>}
              {form.kind === "task" && task && <TaskFields form={task} setForm={setTask} />}
              {form.kind !== "task" && <>
              {form.kind === "shoot" && <div className="space-y-1.5">
                <Label>Voor welke klant?</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger aria-label="Kies klant"><SelectValue placeholder="Kies een klant" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>}
              <div className="space-y-1.5"><Label htmlFor="ag-title">Titel</Label><Input id="ag-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={form.kind === "shoot" ? "Bijv. Shoot najaarscollectie" : form.kind === "meeting" ? "Bijv. Weekstart" : "Vakantie"} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="ag-start">{form.kind === "vacation" ? "Van" : "Datum"}</Label><Input id="ag-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value, end_date: form.end_date < e.target.value ? e.target.value : form.end_date })} /></div>
                {form.kind === "vacation" && <div className="space-y-1.5"><Label htmlFor="ag-end">Tot en met</Label><Input id="ag-end" type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>}
                {form.kind === "shoot" && <div className="space-y-1.5"><Label htmlFor="ag-st">Starttijd</Label><Input id="ag-st" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>}
                {form.kind === "meeting" && <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5"><Label htmlFor="ag-t1">Van</Label><Input id="ag-t1" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="ag-t2">Tot</Label><Input id="ag-t2" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                </div>}
              </div>
              {form.kind !== "vacation" && <div className="space-y-1.5"><Label htmlFor="ag-loc">{form.kind === "shoot" ? "Locatie" : "Locatie of link"}</Label><Input id="ag-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>}
              <div className="space-y-1.5">
                <Label>{form.kind === "shoot" ? "Crew (krijgen een melding)" : form.kind === "meeting" ? "Deelnemers (krijgen een melding)" : "Wie is er vrij?"}</Label>
                <div className="flex flex-wrap gap-2">
                  {team.map((t) => <Button variant="outline" size="sm" key={t.id} type="button" onClick={() => toggle(t.id)} className={cn("flex items-center gap-1.5 rounded-md border border-border py-1 pl-1 pr-3 text-sm", form.people.includes(t.id) ? "bg-foreground text-background" : "bg-popover hover:bg-muted")}><UserAvatar userId={t.id} size={22} />{t.name}</Button>)}
                </div>
              </div>
              {(absent.length > 0 || busyShoot.length > 0) && <div className="flex gap-2 rounded-md bg-muted p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{absent.length > 0 && <p>{absent.map(name).join(", ")} {absent.length > 1 ? "zijn" : "is"} die dag vrij.</p>}{busyShoot.length > 0 && <p>{form.kind === "shoot" ? "Iemand staat die dag al op een andere draaidag" : "Er is die dag een draaidag"}: {busyShoot.map((s) => s.title).join(", ")}.</p>}<p className="text-muted-foreground">Je kunt het toch opslaan.</p></div>
              </div>}
              <div className="space-y-1.5"><Label htmlFor="ag-notes">Notities</Label><Textarea id="ag-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </>}
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              {form.id ? <Button variant="ghost" onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Verwijderen</Button> : <span />}
              <Button onClick={save} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
      <TaskDialog initial={taskEdit} onClose={() => setTaskEdit(null)} />
    </div>
  );
}
