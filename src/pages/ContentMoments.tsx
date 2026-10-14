import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { UserAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/StatsOverview";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPES = { shoot: "Shoot", post: "Post", evenement: "Evenement", actie: "Actie", idee: "Idee" } as const;
const STATUS = { aangevraagd: "Aangevraagd", bevestigd: "Bevestigd", gepland: "Gepland", afgerond: "Afgerond", geannuleerd: "Geannuleerd" } as const;
type Status = keyof typeof STATUS;
export type Moment = {
  id: string; client_id: string; title: string; type: keyof typeof TYPES; date: string | null; start_time: string | null;
  location: string | null; script: string | null; notes: string | null; attendees: string[]; status: Status; requested_by: string | null; created_at: string;
};
export const MOMENT_STATUS = STATUS;
export const MOMENT_TYPES = TYPES;
export const STATUS_STYLE: Record<Status, string> = {
  aangevraagd: "bg-lime text-lime-foreground", bevestigd: "bg-foreground text-background", gepland: "bg-popover text-foreground",
  afgerond: "bg-muted text-foreground", geannuleerd: "bg-muted text-muted-foreground line-through",
};
const fmtDate = (d: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "Nog geen datum");

function useMoments() {
  const { clientId, ready } = useClient();
  return useQuery({
    queryKey: ["content-moments", clientId], enabled: ready && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("content_moments").select("*").eq("client_id", clientId!).order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Moment[];
    },
  });
}

export default function ContentMoments() {
  const { clientId, isAdmin, ready } = useClient();
  const { data: list = [], isLoading } = useMoments();
  const [editing, setEditing] = useState<Moment | "new" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"actief" | "alles">("actief");
  const count = (s: Status) => list.filter((m) => m.status === s).length;
  const shown = filter === "actief" ? list.filter((m) => m.status !== "afgerond" && m.status !== "geannuleerd") : list;
  const selected = list.find((m) => m.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="wordmark">Contentmomenten</h1>
        {clientId && (
          <button onClick={() => setEditing("new")} className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-2 pr-5 text-sm font-medium text-background">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><Plus className="h-4 w-4" /></span>
            {isAdmin ? "Moment toevoegen" : "Moment aanvragen"}
          </button>
        )}
      </div>

      <section className="grid grid-cols-3 gap-3">
        {(["gepland", "bevestigd", "aangevraagd"] as Status[]).map((s) => (
          <div key={s} className="rounded-lg bg-card p-4 md:p-6">
            <div className="flex flex-wrap items-baseline gap-2"><span className="text-[40px] font-light leading-none tabular md:text-[56px]">{count(s)}</span><span className="text-sm text-muted-foreground md:text-base">{STATUS[s]}</span></div>
          </div>
        ))}
      </section>

      <div className="flex gap-2">
        {(["actief", "alles"] as const).map((k) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className="chip-filter">{k === "actief" ? "Komend" : "Alles"}</button>)}
      </div>

      {!clientId && ready ? <section className="rounded-lg bg-card"><EmptyState text="Je account is nog niet aan een klant gekoppeld." /></section>
        : isLoading ? <section className="rounded-lg bg-card"><EmptyState text="Laden…" /></section>
        : shown.length === 0 ? <section className="rounded-lg bg-card"><EmptyState text="Nog geen contentmomenten – vraag er een aan" /></section>
        : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((m) => (
            <li key={m.id}>
              <button onClick={() => setOpenId(m.id)} className="flex h-full w-full flex-col rounded-lg bg-card p-5 text-left transition-colors hover:bg-popover">
                <div className="flex flex-wrap gap-1.5">
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[m.status])}>{STATUS[m.status]}</span>
                  <span className="chip">{TYPES[m.type]}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-xl font-semibold leading-snug">{m.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{fmtDate(m.date)}{m.start_time && ` · ${m.start_time.slice(0, 5)}`}</p>
                {m.location && <p className="text-sm text-muted-foreground">{m.location}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && <MomentDialog m={selected} onClose={() => setOpenId(null)} onEdit={() => { setOpenId(null); setEditing(selected); }} />}
      {editing && clientId && <EditDialog clientId={clientId} moment={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function MomentDialog({ m, onClose, onEdit }: { m: Moment; onClose: () => void; onEdit: () => void }) {
  const { isAdmin } = useClient();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const { data: comments = [], refetch } = useQuery({
    queryKey: ["moment-comments", m.id],
    queryFn: async () => (await supabase.from("content_moment_comments").select("*").eq("moment_id", m.id).order("created_at")).data ?? [],
  });
  useEffect(() => {
    const ids = [...new Set(comments.map((c) => c.user_id))];
    if (ids.length) supabase.from("users").select("id,email,full_name").in("id", ids).then(({ data }) => setNames(Object.fromEntries((data ?? []).map((u) => [u.id, u.full_name || u.email]))));
  }, [comments]);

  const setStatus = async (status: Status) => {
    const { error } = await supabase.from("content_moments").update({ status }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${STATUS[status].toLowerCase()}`);
    qc.invalidateQueries({ queryKey: ["content-moments"] });
  };
  const send = async () => {
    const { error } = await supabase.from("content_moment_comments").insert({ moment_id: m.id, text: text.trim() });
    if (error) return toast.error(error.message);
    setText(""); refetch();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-1.5"><span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[m.status])}>{STATUS[m.status]}</span><span className="chip">{TYPES[m.type]}</span></div>
          <DialogTitle className="text-2xl">{m.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{fmtDate(m.date)}{m.start_time && ` · ${m.start_time.slice(0, 5)}`}{m.location && ` · ${m.location}`}</p>
        </DialogHeader>
        {m.attendees.length > 0 && <div className="flex flex-wrap gap-1.5">{m.attendees.map((a) => <span key={a} className="chip">{a}</span>)}</div>}
        {m.script && <div><h3 className="text-sm font-semibold">Script</h3><p className="whitespace-pre-line text-sm text-foreground/80">{m.script}</p></div>}
        {m.notes && <div><h3 className="text-sm font-semibold">Notities</h3><p className="whitespace-pre-line text-sm text-foreground/80">{m.notes}</p></div>}

        {isAdmin && (
          <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
            {m.status === "aangevraagd" && <Button onClick={() => setStatus("bevestigd")}>Bevestigen</Button>}
            {(m.status === "aangevraagd" || m.status === "bevestigd") && <Button variant="outline" onClick={() => setStatus("gepland")}>Inplannen</Button>}
            {m.status === "gepland" && <Button onClick={() => setStatus("afgerond")}>Afronden</Button>}
            <Button variant="outline" onClick={onEdit}>Bewerken</Button>
            {m.status !== "geannuleerd" && m.status !== "afgerond" && <Button variant="ghost" onClick={() => setStatus("geannuleerd")}>Annuleren</Button>}
          </div>
        )}

        <div className="border-t border-border/70 pt-4">
          <h3 className="mb-2 text-sm font-semibold">Opmerkingen</h3>
          <ol className="mb-3 space-y-2 text-sm">
            {comments.length === 0 && <li className="text-muted-foreground">Nog geen opmerkingen.</li>}
            {comments.map((c) => (
              <li key={c.id} className="rounded-2xl bg-popover p-3">
                <p className="text-xs text-muted-foreground">{names[c.user_id] ?? "Gebruiker"} · {new Date(c.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                <p className="whitespace-pre-line">{c.text}</p>
              </li>
            ))}
          </ol>
          <Label htmlFor="cm" className="sr-only">Opmerking</Label>
          <Textarea id="cm" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Schrijf een opmerking" />
          <Button className="mt-2" disabled={!text.trim()} onClick={send}>Plaatsen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditDialog({ clientId, moment, onClose }: { clientId: string; moment: Moment | null; onClose: () => void }) {
  const { isAdmin } = useClient();
  const { user } = UserAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({
    title: moment?.title ?? "", type: moment?.type ?? "shoot", date: moment?.date ?? "", start_time: moment?.start_time?.slice(0, 5) ?? "",
    location: moment?.location ?? "", script: moment?.script ?? "", notes: moment?.notes ?? "", attendees: moment?.attendees.join(", ") ?? "",
    status: (moment?.status ?? (isAdmin ? "bevestigd" : "aangevraagd")) as Status,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    const row = {
      title: f.title.trim(), type: f.type, date: f.date || null, start_time: f.start_time || null, location: f.location || null,
      script: f.script || null, notes: f.notes || null, attendees: f.attendees.split(",").map((s) => s.trim()).filter(Boolean),
      status: isAdmin ? f.status : "aangevraagd",
    };
    const { error } = moment
      ? await supabase.from("content_moments").update(row).eq("id", moment.id)
      : await supabase.from("content_moments").insert({ ...row, client_id: clientId, requested_by: user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(moment ? "Moment bijgewerkt" : isAdmin ? "Moment toegevoegd" : "Aanvraag verstuurd");
    qc.invalidateQueries({ queryKey: ["content-moments"] });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>{moment ? "Moment bewerken" : isAdmin ? "Moment toevoegen" : "Moment aanvragen"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label htmlFor="t">Titel</Label><Input id="t" value={f.title} onChange={set("title")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Soort</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as Moment["type"] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TYPES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
            {isAdmin && <div><Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as Status })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="d">Datum</Label><Input id="d" type="date" value={f.date} onChange={set("date")} /></div>
            <div><Label htmlFor="st">Starttijd</Label><Input id="st" type="time" value={f.start_time} onChange={set("start_time")} /></div>
          </div>
          <div><Label htmlFor="l">Locatie</Label><Input id="l" value={f.location} onChange={set("location")} /></div>
          <div><Label htmlFor="a">Aanwezigen (komma-gescheiden)</Label><Input id="a" value={f.attendees} onChange={set("attendees")} /></div>
          <div><Label htmlFor="s">Script</Label><Textarea id="s" rows={3} value={f.script} onChange={set("script")} /></div>
          <div><Label htmlFor="n">Notities</Label><Textarea id="n" rows={2} value={f.notes} onChange={set("notes")} /></div>
          <Button disabled={busy || !f.title.trim()} onClick={save}>{moment ? "Opslaan" : isAdmin ? "Toevoegen" : "Aanvraag versturen"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
