import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useCrew, CrewBadge } from "@/components/MomentCrew";
import { UserAuth } from "@/context/AuthContext.jsx";
import { AgendaControls, useAgendaFilters } from "@/components/agenda/AgendaControls";
import { filterAgendaEntries, defaultAgendaFilters, writeAgendaFilters } from "@/lib/agenda-filters";
import { ClientLogo, useLogoUrls } from "@/hooks/useLogoUrl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { filterMomentStatus, momentReferenceImage, momentStatus } from "@/lib/content-moment-list";
import { CONTENT_MOMENT_PHOTOS } from "@/lib/content-moment-photos";

export default function HibeContentmomenten() {
  const { clients } = useClient();

  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Moment | null>(null);
  const [creating, setCreating] = useState<null | "choose" | string>(null);
  const [params, setParams] = useSearchParams();
  useEffect(() => { if (params.get("nieuw")) { setCreating("choose"); const next = new URLSearchParams(params); next.delete("nieuw"); setParams(next, { replace: true }); } }, [params, setParams]);
  const [chosen, setChosen] = useState("");
  const me = UserAuth()?.user?.id ?? "";
  const { filters, setFilters } = useAgendaFilters(me, "contentmomenten");
  const activeStatuses = ["aangevraagd", "bevestigd", "gepland"];
  const statuses = params.has("status") ? (params.get("status") ?? "").split(",").filter(Boolean) : activeStatuses;
  const statusActive = statuses.length !== activeStatuses.length || activeStatuses.some((s) => !statuses.includes(s));
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const initialClient = filters.clients.length === 1 ? filters.clients[0] : "";

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["content-moments", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_moments").select("*").order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as (Moment & { thumbnail_url?: string | null; reference_image_url?: string | null })[];
    },
  });
  const crew = useCrew(all);
  const peopleEntries = all.map((m) => ({ id: m.id, kind: "shoot" as const, start: m.date ?? "", end: m.date ?? "", title: m.title, clientId: m.client_id, people: crew.byMoment(m.id).flatMap((c) => c.user_id ? [c.user_id] : []) }));
  const visibleIds = new Set(filterAgendaEntries(peopleEntries, { ...filters, kinds: defaultAgendaFilters().kinds }, me).map((m) => m.id));
  const list = filterMomentStatus(all.filter((m) => visibleIds.has(m.id)).map((m) => ({ ...m, status: momentStatus(m) as Moment["status"] })), statuses);
  const groups = new Map<string, (Moment & { thumbnail_url?: string | null; reference_image_url?: string | null })[]>();
  for (const m of list) {
    const k = m.date ? new Date(m.date + "T12:00:00").toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) : "Nog geen datum";
    const group = groups.get(k) ?? [];
    group.push(m);
    groups.set(k, group);
  }
  const selected = all.find((m) => m.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <PageHeader title="Contentmomenten" action={<PrimaryAction icon={Plus} onClick={() => { setChosen(initialClient); setCreating("choose"); }}>Moment toevoegen</PrimaryAction>} />
      <AgendaControls filters={filters} onChange={setFilters} onReset={() => { const next = writeAgendaFilters(defaultAgendaFilters(), params); next.delete("status"); setParams(next, { replace: true }); }} entries={peopleEntries} me={me} team={crew.team} clients={clients} hideTypes extraActive={statusActive} extra={
        <div className="flex items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">Status</span><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 rounded-md text-xs" aria-label="Status selecteren">{statusActive ? `${statuses.length} geselecteerd` : "Actieve momenten"}<ChevronDown className="ml-2 h-3 w-3" /></Button></PopoverTrigger><PopoverContent align="start" className="w-60 p-2">
          <Button variant="ghost" className="w-full justify-start rounded-md" onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set("status", Object.keys(MOMENT_STATUS).join(",")); return n; }, { replace: true })}>Alle statussen</Button>
          {Object.entries(MOMENT_STATUS).map(([id, label]) => <Button key={id} variant="ghost" className="w-full justify-between rounded-md" role="menuitemcheckbox" aria-checked={statuses.includes(id)} onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set("status", (statuses.includes(id) ? statuses.filter((x) => x !== id) : [...statuses, id]).join(",")); return n; }, { replace: true })}>{label}{statuses.includes(id) && <Check className="h-4 w-4" />}</Button>)}
        </PopoverContent></Popover></div>
      } />

      {isLoading ? <EmptyState text="Laden…" /> : list.length === 0 ? <EmptyState text="Geen contentmomenten voor deze selectie." action={<Button onClick={() => { setChosen(initialClient); setCreating("choose"); }}><Plus className="mr-2 h-4 w-4" />Moment toevoegen</Button>} /> : [...groups.entries()].map(([month, ms]) => (
        <section key={month} className="overflow-hidden rounded-xl border border-border bg-card" aria-label={month}>
          <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-semibold capitalize">{month}</h2>
          <ul className="divide-y divide-border">
            {ms.map((m) => {
              const client = clients.find((c) => c.id === m.client_id);
              const reference = momentReferenceImage(m) || (m.type === "shoot" && client ? CONTENT_MOMENT_PHOTOS[client.name] : undefined);
              return <li key={m.id} className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-4 transition-colors hover:bg-muted/40 sm:flex-nowrap sm:px-4">
                <Button variant="ghost" className="h-auto w-full min-w-0 justify-start gap-3 rounded-md p-0 text-left hover:bg-transparent sm:w-auto sm:flex-1" onClick={() => setOpenId(m.id)}>
                  <span className="w-14 shrink-0 self-start text-sm font-semibold tabular-nums sm:w-20">{m.date ? new Date(m.date + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" }) : "—"}<span className="mt-1 block text-xs font-normal text-muted-foreground">{m.start_time?.slice(0, 5) ?? ""}</span></span>
                  {reference && <img src={reference} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />}
                  <span className="min-w-0 flex-1 whitespace-normal break-words text-sm font-semibold leading-6 sm:text-base">{m.title}</span>
                </Button>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:max-w-[45%]">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs font-medium"><ClientLogo url={client?.logo_url ? logos[client.logo_url] : undefined} name={client?.name ?? "Klant"} size={20} /><span className="min-w-0 break-words">{client?.name ?? "Klant"}</span></span>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{MOMENT_TYPES[m.type]}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[m.status])}>{MOMENT_STATUS[m.status]}</span>
                </div>
                <div className="shrink-0 sm:ml-auto"><CrewBadge m={m} crew={crew.byMoment(m.id)} asClient={false} maxAvatars={3} /></div>
              </li>;
            })}
          </ul>
        </section>
      ))}

      {selected && <MomentDialog m={selected} allMoments={all} onClose={() => setOpenId(null)} onEdit={() => { setOpenId(null); setEditing(selected); }} />}
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
