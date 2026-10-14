import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { Moment, MomentDialog, EditDialog, MOMENT_STATUS, MOMENT_TYPES, STATUS_STYLE } from "@/pages/ContentMoments";
import { EmptyState } from "@/components/StatsOverview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HibeContentmomenten() {
  const { clients } = useClient();
  const [client, setClient] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Moment | null>(null);
  const [creating, setCreating] = useState<null | "choose" | string>(null);
  const [chosen, setChosen] = useState("");

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["content-moments", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_moments").select("*").order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Moment[];
    },
  });
  const list = all.filter((m) => (client === "all" || m.client_id === client) && (showDone || (m.status !== "afgerond" && m.status !== "geannuleerd")));
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  const groups = new Map<string, Moment[]>();
  for (const m of list) {
    const k = m.date ? new Date(m.date + "T00:00:00").toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) : "Nog geen datum";
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(m);
  }
  const selected = all.find((m) => m.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="wordmark">Contentmomenten</h1>
        <button onClick={() => { setChosen(client !== "all" ? client : ""); setCreating("choose"); }} className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-2 pr-5 text-sm font-medium text-background">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><Plus className="h-4 w-4" /></span>Moment toevoegen
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger aria-label="Filter op klant" className="h-9 w-auto min-w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle klanten</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <button aria-pressed={!showDone} onClick={() => setShowDone(false)} className="chip-filter">Komend</button>
        <button aria-pressed={showDone} onClick={() => setShowDone(true)} className="chip-filter">Alles</button>
      </div>

      {isLoading ? <section className="rounded-lg bg-card"><EmptyState text="Laden…" /></section> : list.length === 0 ? (
        <section className="rounded-lg bg-card"><EmptyState text="Nog geen contentmomenten." /></section>
      ) : [...groups.entries()].map(([month, ms]) => (
        <section key={month} className="rounded-lg bg-card p-5 md:p-7">
          <h2 className="mb-4 text-xl font-semibold capitalize">{month}</h2>
          <ul className="space-y-2">
            {ms.map((m) => (
              <li key={m.id}>
                <button onClick={() => setOpenId(m.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-popover px-4 py-3 text-left hover:bg-background">
                  <span className="w-20 shrink-0 text-sm font-semibold tabular">{m.date ? new Date(m.date + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" }) : "–"}{m.start_time && <span className="block text-xs font-normal text-muted-foreground">{m.start_time.slice(0, 5)}</span>}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{m.title}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <span className="chip">{name(m.client_id)}</span>
                    <span className="chip">{MOMENT_TYPES[m.type]}</span>
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[m.status])}>{MOMENT_STATUS[m.status]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {selected && <MomentDialog m={selected} onClose={() => setOpenId(null)} onEdit={() => { setOpenId(null); setEditing(selected); }} />}
      {editing && <EditDialog clientId={editing.client_id} moment={editing} onClose={() => setEditing(null)} />}
      {creating === "choose" && (
        <Dialog open onOpenChange={(o) => !o && setCreating(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Voor welke klant?</DialogTitle></DialogHeader>
            <Select value={chosen} onValueChange={setChosen}>
              <SelectTrigger aria-label="Kies klant"><SelectValue placeholder="Kies een klant" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!chosen} onClick={() => setCreating(chosen)}>Verder</Button>
          </DialogContent>
        </Dialog>
      )}
      {creating && creating !== "choose" && <EditDialog clientId={creating} moment={null} onClose={() => setCreating(null)} />}
    </div>
  );
}
