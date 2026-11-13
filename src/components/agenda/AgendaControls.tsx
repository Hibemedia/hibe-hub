import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FilterChip } from "@/components/ui/filter-chip";
import { DropdownButton } from "@/components/ui/dropdown-button";
import { UserAvatar } from "@/components/UserAvatar";
import { useLogoUrls } from "@/hooks/useLogoUrl";
import { cn } from "@/lib/utils";
import type { AgendaEntry } from "@/lib/agenda";
import { AGENDA_KINDS, AGENDA_LABELS, AgendaFilters, defaultAgendaFilters, filterAgendaEntries, hasAgendaFilters, hasAgendaParams, readAgendaFilters, writeAgendaFilters } from "@/lib/agenda-filters";

export function useAgendaFilters(me: string, scope = "agenda") {
  const [params, setParams] = useSearchParams();
  const [readyFor, setReadyFor] = useState("");
  useEffect(() => {
    if (!me || readyFor === me) return;
    let restored = defaultAgendaFilters();
    try { const saved = localStorage.getItem(`hibe-${scope}-filters:${me}`); if (saved) restored = readAgendaFilters(new URLSearchParams(saved)); } catch { /* Storage can be unavailable. */ }
    if (!hasAgendaParams(params)) setParams(writeAgendaFilters(restored, params), { replace: true });
    setReadyFor(me);
  }, [me, params, readyFor, setParams, scope]);
  const filters = readAgendaFilters(params);
  useEffect(() => {
    if (!me || readyFor !== me || !hasAgendaParams(params)) return;
    try { localStorage.setItem(`hibe-${scope}-filters:${me}`, writeAgendaFilters(readAgendaFilters(params)).toString()); } catch { /* URL remains functional. */ }
  }, [me, readyFor, params, scope]);
  return { filters, setFilters: (f: AgendaFilters) => setParams(writeAgendaFilters(f, params), { replace: true }) };
}

type Client = { id: string; name: string; logo_url: string | null };
export function AgendaClientLogo({ client, url }: { client?: Client; url?: string }) {
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-xs font-semibold text-foreground">{url ? <img src={url} alt="" className="h-full w-full object-contain" /> : client?.name.slice(0, 1) ?? "—"}</span>;
}

export function AgendaControls({ filters, onChange, entries, me, team, clients, hideTypes = false, extra, extraActive = false, onReset, light = true }: { filters: AgendaFilters; onChange: (f: AgendaFilters) => void; entries: AgendaEntry[]; me: string; team: { id: string; name: string }[]; clients: Client[]; hideTypes?: boolean; extra?: React.ReactNode; extraActive?: boolean; onReset?: () => void; light?: boolean }) {
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const countEntries = filterAgendaEntries(entries, { ...filters, kinds: [...AGENDA_KINDS] }, me);
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-border py-3" aria-label="Agendafilters">
    <div className="flex items-center gap-2">{!light && <span className="text-xs font-semibold text-muted-foreground">Wie</span>}
      <Popover>
        <SegmentedControl label="Wie" value={filters.who} onChange={(who) => onChange({ ...filters, who })} options={[
          { value: "everyone", label: "Iedereen" }, { value: "me", label: "Alleen ik" },
          { value: "team", label: <PopoverTrigger asChild><span className="inline-flex items-center gap-1" aria-label="Team selecteren">Team{filters.who === "team" && filters.people.length > 0 && ` ${filters.people.length}`}<ChevronDown className="h-3 w-3" /></span></PopoverTrigger>, action: () => undefined },
        ]} />
          <PopoverContent align="start" className="w-64 p-2"><p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Teamleden</p><div className="max-h-72 overflow-y-auto">{team.map((t) => <Button key={t.id} variant="ghost" className="h-10 w-full justify-start gap-2 rounded-md px-2" role="menuitemcheckbox" aria-checked={filters.who === "team" && filters.people.includes(t.id)} onClick={() => onChange({ ...filters, who: "team", people: toggle(filters.people, t.id) })}><UserAvatar userId={t.id} size={26} /><span className="min-w-0 flex-1 truncate text-left">{t.name}</span>{filters.who === "team" && filters.people.includes(t.id) && <Check className="h-4 w-4 text-foreground" />}</Button>)}</div></PopoverContent>
      </Popover>
    </div>
    {!hideTypes && <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Type">{!light && <span className="mr-1 text-xs font-semibold text-muted-foreground">Type</span>}
      <FilterChip active={filters.kinds.length === 5} onClick={() => onChange({ ...filters, kinds: [...AGENDA_KINDS] })}>Alles</FilterChip>
      {AGENDA_KINDS.map((k) => <FilterChip key={k} active={filters.kinds.includes(k)} count={countEntries.filter((e) => e.kind === k).length} onClick={() => onChange({ ...filters, kinds: filters.kinds.includes(k) ? filters.kinds.filter((x) => x !== k) : [...filters.kinds, k] })}>{AGENDA_LABELS[k]}</FilterChip>)}
    </div>}
    <div className="flex items-center gap-2">{!light && <span className="text-xs font-semibold text-muted-foreground">Klant</span>}<Popover><PopoverTrigger asChild><DropdownButton size="sm" aria-label="Klanten selecteren" value={filters.clients.length ? `${filters.clients.length} geselecteerd` : "Alle klanten"} /></PopoverTrigger><PopoverContent align="start" className="w-72 p-2"><div className="max-h-72 overflow-y-auto">{clients.map((c) => <Button key={c.id} variant="ghost" className="h-10 w-full justify-start gap-2 rounded-md px-2" role="menuitemcheckbox" aria-checked={filters.clients.includes(c.id)} onClick={() => onChange({ ...filters, clients: toggle(filters.clients, c.id) })}><AgendaClientLogo client={c} url={c.logo_url ? logos[c.logo_url] : undefined} /><span className="min-w-0 flex-1 truncate text-left">{c.name}</span>{filters.clients.includes(c.id) && <Check className="h-4 w-4" />}</Button>)}</div></PopoverContent></Popover></div>
    {extra}
    {(hasAgendaFilters(filters) || extraActive) && <Button variant="ghost" size="sm" className="h-8 rounded-md text-xs" onClick={() => onReset ? onReset() : onChange(defaultAgendaFilters())}><RotateCcw className="mr-1.5 h-3 w-3" />Wis filters</Button>}
  </div>;
}