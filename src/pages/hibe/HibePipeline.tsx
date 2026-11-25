import { FilterChip } from "@/components/ui/filter-chip";
import { Tag } from "@/components/ui/tag";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { PageHeader } from "@/components/PageHeader";
import { MediaTabs } from "@/components/videos/MediaTabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PHASES, ageTone, avgDays, buildCards, daysIn, deliveredThisMonth, slaTone, groupByClient, type Card, type ClientRow } from "@/lib/pipeline";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ymd } from "@/lib/agenda";
import { WORKFLOW } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const db = supabase as any;
function usePipelineData() {
  return useQuery({ queryKey: ["pipeline"], refetchInterval: 60_000, queryFn: async () => {
    const [t, m, e, v, l] = await Promise.all([
      db.from("tasks").select("id,title,client_id,assignee_id,done_at,created_at,moment_id").is("done_at", null),
      db.from("content_moments").select("id,title,client_id,type,status,date,created_at"),
      db.from("edits").select("id,title,client_id,editor_id,status,created_at,updated_at").neq("status", "delivered"),
      db.from("video_items").select("id,title,client_id,status,current_version,archived_at,status_changed_at").is("archived_at", null),
      db.from("edits").select("moment_id").not("moment_id", "is", null),
    ]);
    for (const r of [t, m, e, v, l]) if (r.error) throw r.error;
    return { tasks: t.data ?? [], moments: m.data ?? [], edits: e.data ?? [], videos: v.data ?? [], linkedMoments: (l.data ?? []).map((x: { moment_id: string }) => x.moment_id) };
  } });
}
const TONE = { ok: "bg-muted text-muted-foreground", warn: "bg-tag-warning text-foreground", late: "bg-tag-danger text-foreground" } as const;

export default function HibePipeline() {
  const { data } = usePipelineData();
  const { clients } = useClient();
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const [client, setClient] = useState("all");
  const [lateOnly, setLateOnly] = useState(false);
  const [sort, setSort] = useState<"wait" | "client">("wait");
  const now = new Date();
  const cards = useMemo(() => (data ? buildCards(data, ymd(new Date()), new Date()) : []), [data]);
  const shown = cards.filter((c) => (client === "all" || c.client_id === client) && (!lateOnly || (c.phase !== "done" && ageTone(daysIn(c.since, now)) !== "ok")));
  const rows = groupByClient(shown, now, sort);
  const byId = new Map(clients.map((c) => [c.id, c]));

  return (
    <div className="space-y-4 min-w-0">
      <PageHeader title="Productieboard" />
      <MediaTabs value="board" />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger className="h-9 w-52 rounded-tag"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle klanten</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <FilterChip active={lateOnly} onClick={() => setLateOnly((x) => !x)} className="px-4">Toon vertraagd</FilterChip>
        <span className="text-xs text-muted-foreground">Tijd in fase: tot 3 dagen op schema, 3–5 aandacht, meer dan 5 vertraagd</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Sorteer op</span>
        <FilterChip active={sort === "wait"} onClick={() => setSort("wait")} className="px-4">Langst wachtend</FilterChip>
        <FilterChip active={sort === "client"} onClick={() => setSort("client")} className="px-4">Langst bij klant</FilterChip>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <p className="rounded-[20px] bg-card p-4 text-sm text-muted-foreground">Niets in productie</p>}
        {rows.map((r) => <ClientProgress key={r.client_id} r={r} now={now} client={byId.get(r.client_id)} logo={(u) => (u ? logos[u] : null)} />)}
      </div>
      <SlaBlock clients={clients.filter((c) => client === "all" || c.id === client)} logo={(u) => (u ? logos[u] : null)} />
    </div>
  );
}

const SLA_TONE = { none: "bg-muted text-muted-foreground", met: "bg-lime text-lime-foreground", ok: "bg-muted text-foreground", attention: "bg-tag-warning text-foreground", behind: "bg-tag-danger text-foreground" } as const;
const SLA_LABEL = { none: "Geen SLA", met: "Gehaald", ok: "Op schema", attention: "Aandacht", behind: "Loopt achter" } as const;
function SlaBlock({ clients, logo }: { clients: { id: string; name: string; logo_url: string | null }[]; logo: (u: string | null) => string | null | undefined }) {
  const qc = useQueryClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data } = useQuery({ queryKey: ["sla", start], queryFn: async () => {
    const [v, c] = await Promise.all([
      db.from("video_items").select("client_id,status,status_changed_at").eq("status", "scheduled").gte("status_changed_at", start),
      db.from("clients").select("id,monthly_video_target"),
    ]);
    if (v.error) throw v.error; if (c.error) throw c.error;
    return { counts: deliveredThisMonth(v.data ?? [], now), targets: Object.fromEntries((c.data ?? []).map((r: any) => [r.id, r.monthly_video_target])) as Record<string, number | null> };
  } });
  const save = async (id: string, raw: string) => {
    const val = raw.trim() === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
    if (val === (data?.targets[id] ?? null)) return;
    const { error } = await db.from("clients").update({ monthly_video_target: val }).eq("id", id);
    if (error) return toast.error("SLA opslaan mislukt");
    qc.invalidateQueries({ queryKey: ["sla"] });
  };
  const month = now.toLocaleDateString("nl-NL", { month: "long" });
  return (
    <section className="rounded-[20px] bg-card p-4">
      <header className="mb-3"><h2 className="truncate font-bold">Opgeleverd in {month}</h2><p className="text-xs text-muted-foreground">Ingepland = opgeleverd. Vul per klant de SLA in (video's per maand).</p></header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clients.map((c) => {
          const done = data?.counts[c.id] ?? 0; const target = data?.targets[c.id] ?? null; const tone = slaTone(done, target, now);
          const pct = target ? Math.min(100, Math.round((done / target) * 100)) : 0;
          return (
            <div key={c.id} className="min-w-0 rounded-2xl bg-background p-3">
              <div className="flex min-w-0 items-center gap-2"><ClientLogo url={logo(c.logo_url) ?? null} name={c.name} size={22} /><p className="truncate text-sm font-semibold">{c.name}</p></div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-2xl font-extrabold leading-none">{done}<span className="text-sm font-semibold text-muted-foreground"> / </span>
                  <input key={String(target)} aria-label={`SLA ${c.name}`} defaultValue={target ?? ""} placeholder="–" inputMode="numeric" onBlur={(e) => save(c.id, e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="w-10 rounded-md bg-muted px-1 text-sm font-semibold" />
                </p>
                <Tag className={cn("rounded-tag px-2 py-0.5 text-[11px] font-semibold", SLA_TONE[tone])}>{SLA_LABEL[tone]}</Tag>
              </div>
              {target ? <div className="mt-2 h-1.5 overflow-hidden rounded-tag bg-muted"><div className={cn("h-full rounded-tag", tone === "behind" ? "bg-destructive" : tone === "attention" ? "bg-warning" : tone === "met" ? "bg-lime" : "bg-foreground")} style={{ width: `${pct}%` }} /></div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PipeCard({ c, days, client, logo }: { c: Card; days: number; client?: { name: string; logo_url: string | null }; logo: (u: string | null) => string | null | undefined }) {
  const tone = ageTone(days);
  return (
    <Link to={c.href} className="block min-w-0 rounded-2xl bg-background p-2.5 hover:ring-1 hover:ring-foreground/20">
      <p className="truncate text-sm font-semibold">{c.title}</p>
      {client && <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><ClientLogo url={logo(client.logo_url) ?? null} name={client.name} size={16} /><span className="truncate">{client.name}</span></div>}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Tag className="rounded-tag bg-tag-neutral px-2 py-0.5 text-[11px] font-semibold text-foreground">{c.turn}</Tag>
        {c.round && <Tag className="rounded-tag bg-muted px-2 py-0.5 text-[11px]">Ronde {c.round}</Tag>}
        <Tag className={cn("rounded-tag px-2 py-0.5 text-[11px] font-semibold", TONE[tone])}>{days}d in fase</Tag>
      </div>
    </Link>
  );
}

const ago = (d: number) => (d === 0 ? "Vandaag ingepland" : d === 1 ? "Gisteren ingepland" : `${d} dagen geleden`);
function DoneColumn({ n, cards, now, byId, logo }: { n: number; cards: Card[]; now: Date; byId: Map<string, { name: string; logo_url: string | null }>; logo: (u: string | null) => string | null | undefined }) {
  return (
    <section className="min-w-0 rounded-[20px] bg-foreground p-3 text-background">
      <header className="mb-3 min-w-0">
        <div className="flex items-center justify-between gap-2"><h2 className="truncate font-bold">{n}. Ingepland</h2><Tag className="rounded-tag bg-tag-success px-2 text-xs font-bold text-foreground">{cards.length}</Tag></div>
        <p className="truncate text-xs text-background/60">Afgerond, laatste 7 dagen</p>
      </header>
      <div className="mb-3 rounded-2xl bg-lime p-3 text-lime-foreground">
        <p className="text-3xl font-extrabold leading-none">{cards.length}</p>
        <p className="mt-1 text-xs font-semibold">{cards.length === 1 ? "productie afgerond" : "producties afgerond"} deze week{cards.length >= 5 ? " - sterk bezig" : cards.length > 0 ? " - lekker" : ""}</p>
      </div>
      <div className="space-y-2">
        {cards.length === 0 && <p className="text-xs text-background/60">Nog niets afgerond. De eerste komt eraan.</p>}
        {[...cards].sort((a, b) => b.since.localeCompare(a.since)).map((c) => {
          const cl = c.client_id ? byId.get(c.client_id) : undefined;
          return (
            <Link key={c.id} to={c.href} className="flex min-w-0 items-start gap-2 rounded-2xl bg-background/10 p-2.5 transition-colors hover:bg-background/15">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-tag bg-lime text-[11px] font-black text-lime-foreground">✓</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.title}</p>
                {cl && <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-background/70"><ClientLogo url={logo(cl.logo_url) ?? null} name={cl.name} size={16} /><span className="truncate">{cl.name}</span></div>}
                <p className="mt-1 text-[11px] font-semibold text-lime">{ago(daysIn(c.since, now))}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const SEG = { ok: "bg-lime text-lime-foreground", warn: "bg-tag-warning text-foreground", late: "bg-tag-danger text-foreground" } as const;
function ClientProgress({ r, now, client, logo }: { r: ClientRow; now: Date; client?: { name: string; logo_url: string | null }; logo: (u: string | null) => string | null | undefined }) {
  const [sel, setSel] = useState<string | null>(null);
  const pick = (k: string) => setSel((x) => (x === k ? null : k));
  const list = r.cards.filter((c) => (sel === "all" ? c.phase !== "done" : c.phase === sel)).sort((a, b) => daysIn(b.since, now) - daysIn(a.since, now));
  const tone = ageTone(r.maxWait);
  return (
    <section className="rounded-[20px] bg-card p-3">
      <div className="flex w-full min-w-0 flex-col gap-3 text-left lg:flex-row lg:items-center">
        <button type="button" onClick={() => pick("all")} className="flex min-w-0 items-center gap-2 text-left lg:w-56 lg:shrink-0">
          <ClientLogo url={logo(client?.logo_url ?? null) ?? null} name={client?.name ?? "?"} size={26} />
          <div className="min-w-0"><p className="truncate text-sm font-bold">{client?.name ?? "Onbekend"}</p>
            <p className="text-xs text-muted-foreground">{r.cards.filter((c) => c.phase !== "done").length} open · {r.phases.client.n ? `${r.phases.client.n} bij klant · ${r.clientWait}d` : "niets bij klant"}</p></div>
        </button>
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1 sm:grid-cols-4 xl:grid-cols-6">
          {PHASES.map((p) => {
            const ph = r.phases[p.key];
            const t = p.key === "done" ? "ok" : ageTone(ph.maxDays);
            return (
              <button type="button" key={p.key} disabled={!ph.n} onClick={() => pick(p.key)} title={`${p.label} · ${p.owner}`} className={cn("min-w-0 rounded-tag px-2 py-1.5 text-left", ph.n ? (`ui-tag ${WORKFLOW[p.key === "check" ? "internal_review" : p.key === "capcut" ? "approved_internal" : p.key === "ready" ? "ready_for_client" : p.key === "client" ? "client_review" : p.key === "final" ? "approved_client" : p.key === "done" ? "scheduled" : p.key].cls}`) : "bg-muted text-muted-foreground", sel === p.key && "ring-2 ring-foreground")}>
                <p className="whitespace-normal text-[11px] font-semibold leading-4">{p.label}</p>
                <p className="text-xs">{ph.n ? <><b>{ph.n}</b>{p.key !== "done" && ` · ${ph.maxDays}d`}</> : "–"}</p>
              </button>
            );
          })}
        </div>
        <Tag className={cn("shrink-0 self-start rounded-tag px-2 py-0.5 text-[11px] font-semibold lg:self-center", TONE[tone])}>Wacht {r.maxWait}d</Tag>
      </div>
      {sel && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((c) => (
            <div key={c.id} className="min-w-0">{sel === "all" && <p className="mb-1 text-[11px] font-semibold text-muted-foreground">{PHASES.find((p) => p.key === c.phase)?.label}</p>}<PipeCard c={c} days={daysIn(c.since, now)} logo={logo} /></div>
          ))}
        </div>
      )}
    </section>
  );
}
