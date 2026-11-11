import { useMemo, useState } from "react";
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
import { AgendaEntry, AgendaKind, absentOn, entriesOn, monthGrid, shootRow, ymd } from "@/lib/agenda";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const db = supabase as any;
const KIND_LABEL: Record<AgendaKind, string> = { shoot: "Draaidag", meeting: "Meeting", vacation: "Vrij" };
const KIND_CLS: Record<AgendaKind, string> = {
  shoot: "bg-lime text-lime-foreground",
  meeting: "bg-foreground text-background",
  vacation: "bg-muted text-muted-foreground border border-dashed border-border",
};
const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

type Ev = { id: string; kind: "meeting" | "vacation"; title: string; start_date: string; end_date: string; start_time: string | null; end_time: string | null; location: string | null; notes: string | null; person_id: string | null; attendees: { user_id: string }[] };
type Form = { id?: string; kind: AgendaKind; title: string; start_date: string; end_date: string; start_time: string; end_time: string; location: string; notes: string; people: string[]; client_id: string };

function useAgenda(from: string, to: string) {
  return useQuery({
    queryKey: ["agenda", from, to],
    queryFn: async () => {
      const [ev, mo] = await Promise.all([
        db.from("calendar_events").select("*, attendees:calendar_attendees(user_id)").lte("start_date", to).gte("end_date", from),
        db.from("content_moments").select("id,title,date,start_time,client_id,status,crew:moment_crew(user_id)").gte("date", from).lte("date", to),
      ]);
      if (ev.error) throw ev.error;
      if (mo.error) throw mo.error;
      return { events: (ev.data ?? []) as Ev[], moments: (mo.data ?? []) as any[] };
    },
  });
}

export default function HibeAgenda() {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const from = ymd(grid[0]), to = ymd(grid[41]);
  const { data } = useAgenda(from, to);
  const { data: team = [] } = useTeamMembers();
  const { clients } = useClient();
  const me = ((UserAuth() as any)?.user?.id as string) ?? "";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const name = (id: string) => team.find((t) => t.id === id)?.name ?? "Teamlid";

  const entries: AgendaEntry[] = useMemo(() => [
    ...(data?.moments ?? []).filter((m) => m.date && m.status !== "cancelled").map((m) => ({
      id: m.id, kind: "shoot" as const, start: m.date, end: m.date, time: m.start_time?.slice(0, 5),
      title: `${clients.find((c) => c.id === m.client_id)?.name ?? "Klant"} · ${m.title}`, people: (m.crew ?? []).map((c: any) => c.user_id),
    })),
    ...(data?.events ?? []).map((e) => ({
      id: e.id, kind: e.kind, start: e.start_date, end: e.end_date, time: e.start_time?.slice(0, 5),
      title: e.kind === "vacation" ? `${e.person_id ? name(e.person_id) : ""} ${e.title}`.trim() : e.title,
      people: e.kind === "vacation" ? (e.person_id ? [e.person_id] : []) : e.attendees.map((a) => a.user_id),
    })),
  ], [data, clients, team]);

  const blank = (day: string, kind: Form["kind"] = "meeting"): Form => ({ kind, title: kind === "vacation" ? "Vakantie" : "", start_date: day, end_date: day, start_time: kind === "meeting" ? "10:00" : "", end_time: kind === "meeting" ? "11:00" : "", location: "", notes: "", people: kind === "vacation" ? [me] : [], client_id: "" });
  const open = (e: AgendaEntry) => {
    if (e.kind === "shoot") return nav("/hibe/contentmomenten");
    const ev = data?.events.find((x) => x.id === e.id); if (!ev) return;
    setForm({ id: ev.id, kind: ev.kind, title: ev.title, start_date: ev.start_date, end_date: ev.end_date, start_time: ev.start_time?.slice(0, 5) ?? "", end_time: ev.end_time?.slice(0, 5) ?? "", location: ev.location ?? "", notes: ev.notes ?? "", people: ev.kind === "vacation" ? (ev.person_id ? [ev.person_id] : []) : ev.attendees.map((a) => a.user_id), client_id: "" });
  };

  const warn = !!form && form.kind !== "vacation";
  const absent = warn ? absentOn(form.start_date, entries.filter((e) => e.id !== form.id)).filter((p) => form.people.includes(p)) : [];
  const busyShoot = warn ? entries.filter((e) => e.kind === "shoot" && e.start === form.start_date && e.people.some((p) => form.people.includes(p))) : [];

  const save = async () => {
    if (!form) return;
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
  const shift = (d: number) => setCursor((c) => { const x = new Date(c.y, c.m + d, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
  const toggle = (id: string) => form && setForm({ ...form, people: form.kind === "vacation" ? [id] : form.people.includes(id) ? form.people.filter((p) => p !== id) : [...form.people, id] });

  return (
    <div className="space-y-4">
      <PageHeader title="Agenda" action={<PrimaryAction icon={Plus} onClick={() => setForm(blank(today))}>Nieuw item</PrimaryAction>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Vorige maand" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Volgende maand" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          <h2 className="ml-1 text-lg font-semibold capitalize">{title}</h2>
          <Button variant="ghost" size="sm" onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}>Vandaag</Button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(["shoot", "meeting", "vacation"] as AgendaKind[]).map((k) => <span key={k} className={cn("rounded-full px-2.5 py-1 font-medium", KIND_CLS[k])}>{KIND_LABEL[k]}</span>)}
        </div>
      </div>
      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium uppercase text-muted-foreground">
          {DAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const day = ymd(d); const list = entriesOn(day, entries); const out = d.getMonth() !== cursor.m;
            return (
              <div key={day} onClick={() => setForm(blank(day))} className={cn("min-h-[92px] min-w-0 cursor-pointer border-border p-1 sm:min-h-[112px] sm:p-1.5 hover:bg-muted/50", i % 7 !== 6 && "border-r", i < 35 && "border-b", (out || i % 7 > 4) && "bg-muted/30")}>
                <div className={cn("mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular", day === today && "bg-foreground font-semibold text-background", out && "text-muted-foreground/60")}>{d.getDate()}</div>
                <div className="space-y-0.5">
                  {list.slice(0, 3).map((e) => (
                    <button key={e.id} onClick={(ev) => { ev.stopPropagation(); open(e); }} title={e.title} className={cn("block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium", KIND_CLS[e.kind])}>
                      {e.time && <span className="hidden sm:inline">{e.time} </span>}{e.title}
                    </button>
                  ))}
                  {list.length > 3 && <p className="px-1 text-[11px] text-muted-foreground">+{list.length - 3} meer</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg">
          {form && <>
            <DialogHeader><DialogTitle>{form.id ? "Bewerken" : "Nieuw in de agenda"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {!form.id && <div className="flex gap-2">
                {(["meeting", "vacation"] as const).map((k) => <button key={k} onClick={() => setForm({ ...blank(form.start_date, k) })} className={cn("chip-filter", form.kind === k && "bg-foreground text-background")}>{k === "meeting" ? "Meeting" : "Vakantie / vrij"}</button>)}
              </div>}
              <div className="space-y-1.5"><Label htmlFor="ag-title">Titel</Label><Input id="ag-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={form.kind === "meeting" ? "Bijv. Weekstart" : "Vakantie"} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="ag-start">{form.kind === "meeting" ? "Datum" : "Van"}</Label><Input id="ag-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value, end_date: form.end_date < e.target.value ? e.target.value : form.end_date })} /></div>
                {form.kind === "vacation" && <div className="space-y-1.5"><Label htmlFor="ag-end">Tot en met</Label><Input id="ag-end" type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>}
                {form.kind === "meeting" && <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5"><Label htmlFor="ag-t1">Van</Label><Input id="ag-t1" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="ag-t2">Tot</Label><Input id="ag-t2" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                </div>}
              </div>
              {form.kind === "meeting" && <div className="space-y-1.5"><Label htmlFor="ag-loc">Locatie of link</Label><Input id="ag-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>}
              <div className="space-y-1.5">
                <Label>{form.kind === "meeting" ? "Deelnemers (krijgen een melding)" : "Wie is er vrij?"}</Label>
                <div className="flex flex-wrap gap-2">
                  {team.map((t) => <button key={t.id} type="button" onClick={() => toggle(t.id)} className={cn("flex items-center gap-1.5 rounded-full border border-border py-1 pl-1 pr-3 text-sm", form.people.includes(t.id) ? "bg-foreground text-background" : "bg-popover hover:bg-muted")}><UserAvatar userId={t.id} size={22} />{t.name}</button>)}
                </div>
              </div>
              {(absent.length > 0 || busyShoot.length > 0) && <div className="flex gap-2 rounded-md bg-muted p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{absent.length > 0 && <p>{absent.map(name).join(", ")} {absent.length > 1 ? "zijn" : "is"} die dag vrij.</p>}{busyShoot.length > 0 && <p>Er is die dag een draaidag: {busyShoot.map((s) => s.title).join(", ")}.</p>}<p className="text-muted-foreground">Je kunt het toch opslaan.</p></div>
              </div>}
              <div className="space-y-1.5"><Label htmlFor="ag-notes">Notities</Label><Textarea id="ag-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              {form.id ? <Button variant="ghost" onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Verwijderen</Button> : <span />}
              <Button onClick={save} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
