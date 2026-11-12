import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PHASES, ageTone, avgDays, buildCards, daysIn, type Card } from "@/lib/pipeline";
import { ymd } from "@/lib/agenda";
import { cn } from "@/lib/utils";

const db = supabase as any;
function usePipelineData() {
  return useQuery({ queryKey: ["pipeline"], refetchInterval: 60_000, queryFn: async () => {
    const [t, m, e, v] = await Promise.all([
      db.from("tasks").select("id,title,client_id,assignee_id,done_at,created_at").is("done_at", null),
      db.from("content_moments").select("id,title,client_id,type,status,date,created_at"),
      db.from("edits").select("id,title,client_id,editor_id,status,created_at,updated_at").neq("status", "delivered"),
      db.from("video_items").select("id,title,client_id,status,current_version,archived_at,status_changed_at").is("archived_at", null),
    ]);
    for (const r of [t, m, e, v]) if (r.error) throw r.error;
    return { tasks: t.data ?? [], moments: m.data ?? [], edits: e.data ?? [], videos: v.data ?? [] };
  } });
}
const TONE = { ok: "bg-muted text-muted-foreground", warn: "bg-orange-100 text-orange-800", late: "bg-red-100 text-red-700" } as const;

export default function HibePipeline() {
  const { data } = usePipelineData();
  const { clients } = useClient();
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const [client, setClient] = useState("all");
  const [lateOnly, setLateOnly] = useState(false);
  const now = new Date();
  const cards = useMemo(() => (data ? buildCards(data, ymd(new Date()), new Date()) : []), [data]);
  const shown = cards.filter((c) => (client === "all" || c.client_id === client) && (!lateOnly || (c.phase !== "done" && ageTone(daysIn(c.since, now)) !== "ok")));
  const byId = new Map(clients.map((c) => [c.id, c]));

  return (
    <div className="space-y-4 min-w-0">
      <PageHeader title="Productieboard" />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger className="h-9 w-52 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle klanten</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <button onClick={() => setLateOnly((x) => !x)} className={cn("h-9 rounded-full px-4 text-sm font-semibold", lateOnly ? "bg-foreground text-background" : "bg-card")}>Toon vertraagd</button>
        <span className="text-xs text-muted-foreground">Tijd in fase: tot 3 dagen op schema, 3–5 aandacht, meer dan 5 vertraagd</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1600px] grid-cols-8 gap-3">
          {PHASES.map((p, i) => {
            const col = shown.filter((c) => c.phase === p.key);
            const avg = avgDays(col, now);
            if (p.key === "done") return <DoneColumn key={p.key} n={i + 1} cards={col} now={now} byId={byId} logo={(u) => (u ? logos[u] : null)} />;
            return (
              <section key={p.key} className="min-w-0 rounded-[20px] bg-card p-3">
                <header className="mb-3 min-w-0">
                  <div className="flex items-center justify-between gap-2"><h2 className="truncate font-bold">{i + 1}. {p.label}</h2><span className="rounded-full bg-background px-2 text-xs font-semibold">{col.length}</span></div>
                  <p className="truncate text-xs text-muted-foreground">{p.owner}{avg !== null && ` · gem. ${avg}d`}</p>
                </header>
                <div className="space-y-2">
                  {col.length === 0 && <p className="text-xs text-muted-foreground">Niets in deze fase</p>}
                  {col.map((c) => <PipeCard key={c.id} c={c} days={daysIn(c.since, now)} client={c.client_id ? byId.get(c.client_id) : undefined} logo={(u) => (u ? logos[u] : null)} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PipeCard({ c, days, client, logo }: { c: Card; days: number; client?: { name: string; logo_url: string | null }; logo: (u: string | null) => string | null | undefined }) {
  const tone = ageTone(days);
  return (
    <Link to={c.href} className="block min-w-0 rounded-2xl bg-background p-2.5 hover:ring-1 hover:ring-foreground/20">
      <p className="truncate text-sm font-semibold">{c.title}</p>
      {client && <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><ClientLogo url={logo(client.logo_url) ?? null} name={client.name} size={16} /><span className="truncate">{client.name}</span></div>}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background">{c.turn}</span>
        {c.round && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">Ronde {c.round}</span>}
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE[tone])}>{days}d in fase</span>
      </div>
    </Link>
  );
}

const ago = (d: number) => (d === 0 ? "Vandaag ingepland" : d === 1 ? "Gisteren ingepland" : `${d} dagen geleden`);
function DoneColumn({ n, cards, now, byId, logo }: { n: number; cards: Card[]; now: Date; byId: Map<string, { name: string; logo_url: string | null }>; logo: (u: string | null) => string | null | undefined }) {
  return (
    <section className="min-w-0 rounded-[20px] bg-foreground p-3 text-background">
      <header className="mb-3 min-w-0">
        <div className="flex items-center justify-between gap-2"><h2 className="truncate font-bold">{n}. Ingepland</h2><span className="rounded-full bg-lime px-2 text-xs font-bold text-lime-foreground">{cards.length}</span></div>
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
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime text-[11px] font-black text-lime-foreground">✓</span>
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
