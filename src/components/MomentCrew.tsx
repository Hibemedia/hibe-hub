import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useViewAs } from "@/context/ViewAs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crewConflicts, needsCrew, CrewRow } from "@/lib/crew";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { Portal as TooltipPortal } from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type Member = { id: string; name: string; avatar_url: string | null };
export type ShownCrew = { moment_id: string; user_id?: string; name: string; avatar_url: string | null; role?: string | null };
const db = supabase as any;

export function useTeam(enabled = true) {
  return useQuery({
    queryKey: ["hibe-team"], staleTime: 600_000, enabled,
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

/** Crew per moment. HIBE reads the table; clients (and "Bekijk als klant") only get first name + photo when allowed. */
export function useCrew(moments: { id: string; show_crew_to_client?: boolean }[]) {
  const { isAdmin } = useClient();
  const viewAs = useViewAs();
  const asClient = !isAdmin || !!viewAs;
  const team = useTeam(isAdmin);
  const raw = useQuery({
    queryKey: ["moment-crew", isAdmin ? "admin" : "client"],
    queryFn: async () => {
      if (isAdmin) { const { data } = await db.from("moment_crew").select("moment_id,user_id,role"); return (data ?? []) as CrewRow[]; }
      const { data } = await db.rpc("client_moment_crew"); return (data ?? []) as { moment_id: string; first_name: string; avatar_url: string | null }[];
    },
  });
  const rows = (raw.data ?? []) as any[];
  const hidden = new Set(moments.filter((m) => m.show_crew_to_client === false).map((m) => m.id));
  const shown: ShownCrew[] = isAdmin
    ? rows.filter((r) => !(asClient && hidden.has(r.moment_id))).map((r) => {
        const m = team.data?.find((t) => t.id === r.user_id);
        const name = m?.name ?? "Teamlid";
        return asClient ? { moment_id: r.moment_id, name: name.split(" ")[0], avatar_url: m?.avatar_url ?? null } : { moment_id: r.moment_id, user_id: r.user_id, name, avatar_url: m?.avatar_url ?? null, role: r.role };
      })
    : rows.map((r) => ({ moment_id: r.moment_id, name: r.first_name, avatar_url: r.avatar_url }));
  const byMoment = (id: string) => shown.filter((c) => c.moment_id === id);
  return { byMoment, rows: (isAdmin ? rows : []) as CrewRow[], team: team.data ?? [], asClient };
}

export function CrewAvatar({ c, size = 24 }: { c: { name: string; avatar_url: string | null; user_id?: string }; size?: number }) {
  return <UserAvatar userId={c.user_id} name={c.name} url={c.avatar_url} size={size} className="ring-2 ring-card" />;
}

function CrewPhoto({ c }: { c: ShownCrew }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={c.name} onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }} className="relative h-8 w-8 shrink-0 rounded-full p-0 hover:z-10 focus-visible:z-10">
          <CrewAvatar c={c} size={32} />
        </Button>
      </TooltipTrigger>
      <TooltipPortal><TooltipContent side="top" sideOffset={8} className="max-w-64 whitespace-normal break-words text-center text-sm">{c.name}</TooltipContent></TooltipPortal>
    </Tooltip>
  );
}

/** Avatars on a moment row/card, or the orange label for a shoot day without crew (HIBE only). */
export function CrewBadge({ m, crew, asClient, showNames }: { m: { id: string; type: string; status: string; date: string | null }; crew: ShownCrew[]; asClient: boolean; showNames?: boolean }) {
  if (crew.length === 0) return !asClient && needsCrew(m, 0) ? <span className="inline-flex rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">Nog niemand ingepland</span> : null;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="flex max-w-full flex-wrap -space-x-2 gap-y-1" role="group" aria-label="Ingeplande crew">{crew.map((c, i) => <CrewPhoto key={c.user_id ?? `${c.name}-${i}`} c={c} />)}</span>
      {showNames && <span className="min-w-0 break-words text-sm text-muted-foreground">{crew.map((c) => c.name.split(" ")[0]).join(", ")}</span>}
    </span>
  );
}

/** HIBE-only crew editor inside the moment dialog. */
export function CrewEditor({ m, allMoments }: { m: { id: string; date: string | null; type: string; status: string; show_crew_to_client: boolean }; allMoments: { id: string; date: string | null; type: string; status: string; title?: string }[] }) {
  const qc = useQueryClient();
  const { rows, team } = useCrew([]);
  const crew = rows.filter((r) => r.moment_id === m.id);
  const [pick, setPick] = useState("");
  const [role, setRole] = useState("");
  const [show, setShow] = useState(m.show_crew_to_client);
  const refresh = () => qc.invalidateQueries({ queryKey: ["moment-crew"] });
  const member = (id: string) => team.find((t) => t.id === id);
  const conflicts = pick ? crewConflicts(pick, m, allMoments, rows) : [];

  const add = async () => {
    const { error } = await db.from("moment_crew").insert({ moment_id: m.id, user_id: pick, role: role.trim() || null });
    if (error) return toast.error(error.message);
    const c = crewConflicts(pick, m, allMoments, rows);
    if (c.length) toast.warning(`${member(pick)?.name} staat die dag ook op ${c.map((x: any) => x.title ?? "een andere draaidag").join(", ")}`);
    else toast.success(`${member(pick)?.name} ingepland`);
    setPick(""); setRole(""); refresh();
  };
  const remove = async (uid: string) => { const { error } = await db.from("moment_crew").delete().eq("moment_id", m.id).eq("user_id", uid); if (error) toast.error(error.message); refresh(); };
  const setRoleOf = async (uid: string, r: string) => { await db.from("moment_crew").update({ role: r.trim() || null }).eq("moment_id", m.id).eq("user_id", uid); refresh(); };
  const toggle = async (v: boolean) => {
    setShow(v);
    const { error } = await db.from("content_moments").update({ show_crew_to_client: v }).eq("id", m.id);
    if (error) { setShow(!v); return toast.error(error.message); }
    qc.invalidateQueries({ queryKey: ["content-moments"] });
  };

  return (
    <div className="border-t border-border/70 pt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Crew</h3>
        <label className="flex items-center gap-2 text-sm"><Switch checked={show} onCheckedChange={toggle} aria-label="Crew tonen aan klant" />Crew tonen aan klant</label>
      </div>
      {crew.length === 0 && <p className="mb-2 text-sm text-warning">Nog niemand ingepland.</p>}
      <ul className="mb-3 space-y-1.5">
        {crew.map((c) => {
          const mm = member(c.user_id);
          const clash = crewConflicts(c.user_id, m, allMoments, rows);
          return (
            <li key={c.user_id} className="flex items-center gap-2 rounded-lg bg-popover px-3 py-2">
              <CrewAvatar c={{ name: mm?.name ?? "?", avatar_url: mm?.avatar_url ?? null, user_id: c.user_id }} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{mm?.name ?? "Teamlid"}{clash.length > 0 && <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-warning"><AlertTriangle className="h-3 w-3" />ook op andere draaidag</span>}</span>
              <Input defaultValue={c.role ?? ""} placeholder="Rol (optioneel)" aria-label={`Rol van ${mm?.name}`} className="h-8 w-32" onBlur={(e) => e.target.value !== (c.role ?? "") && setRoleOf(c.user_id, e.target.value)} />
              <button onClick={() => remove(c.user_id)} aria-label={`${mm?.name} verwijderen`} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Select value={pick} onValueChange={setPick}>
          <SelectTrigger aria-label="Teamlid kiezen" className="h-9 min-w-40 flex-1"><SelectValue placeholder="Teamlid kiezen" /></SelectTrigger>
          <SelectContent>{team.filter((t) => !crew.some((c) => c.user_id === t.id)).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Rol, bijv. camera" aria-label="Rol" className="h-9 w-36" />
        <Button size="sm" className="h-9" disabled={!pick} onClick={add}>Toevoegen</Button>
      </div>
      {conflicts.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-sm text-warning"><AlertTriangle className="h-4 w-4" />Let op: {member(pick)?.name} staat die dag al op {conflicts.map((x: any) => x.title ?? "een andere draaidag").join(", ")}. Toevoegen kan wel.</p>}
    </div>
  );
}
