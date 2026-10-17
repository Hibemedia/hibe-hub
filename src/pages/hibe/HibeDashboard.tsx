import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowUpDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useClient } from "@/context/ClientContext";
import { useHibeOverview, useHibeActions, ClientSummary, type TopVideo } from "@/hooks/useHibeOverview";
import { useMySettings } from "@/hooks/useMySettings";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { PeriodSelect } from "@/components/PeriodSelect";
import { Section, EmptyState, Change } from "@/components/StatsOverview";
import { WeatherCard } from "@/components/WeatherCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, NETWORK_LABELS, Network, PeriodKey } from "@/lib/stats";
import { cn } from "@/lib/utils";

const TZ = "Europe/Amsterdam";
export function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("nl-NL", { hour: "numeric", hour12: false, timeZone: TZ }).format(now));
  return h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond";
}
const series = (i: number) => `hsl(var(--series-${Math.min(i + 1, 7)}))`;

export default function HibeDashboard() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { clients } = useClient();
  const { data: me } = useMySettings();
  const { data, isLoading } = useHibeOverview(period);
  const { data: actions } = useHibeActions(clients.map((c) => c.id));
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const today = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date());
  const t = data?.totals;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-8">
      <div>
        <h1 className="wordmark">{greeting()}{me?.name ? ` ${me.name}` : ""}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{today}</p>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">{me && <WeatherCard lat={me.lat} lon={me.lon} place={me.place} />}</div>
        {data && <TopVideosSmall videos={data.videos} names={Object.fromEntries(clients.map((c) => [c.id, c.name]))} className="xl:col-span-2" />}
      </div>

      <PeriodSelect value={period} onChange={setPeriod} only={["7d", "30d", "90d"]} />

      {isLoading || !t ? <Skeleton className="h-40 rounded-lg" /> : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Weergaven", value: t.views, change: <><Change value={t.viewsChange} /> <span className="text-muted-foreground">vs. vorige</span></> },
            { label: "Volgers", value: t.followers, change: <span className="text-muted-foreground">alle kanalen samen</span> },
            { label: "Nieuwe volgers", value: t.newFollowers, change: <><Change value={t.newFollowers} suffix="" /> <span className="text-muted-foreground">deze periode</span></> },
            { label: "Posts", value: t.posts, change: <><Change value={t.postsChange} /> <span className="text-muted-foreground">vs. vorige</span></> },
          ].map((it) => (
            <div key={it.label} className="rounded-lg bg-card p-5 md:p-6">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[44px] font-light leading-none tracking-tight tabular xl:text-[56px]">{formatNumber(it.value)}</span>
                <span className="text-base text-muted-foreground">{it.label}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs tabular">{it.change}</div>
            </div>
          ))}
        </section>
      )}

      {data && <ViewsChart data={data} names={Object.fromEntries(clients.map((c) => [c.id, c.name]))} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {data && <Ranking rows={data.summaries} className="xl:col-span-3" logos={logos} />}
        <ActionNeeded className="xl:col-span-2" actions={actions} />
      </div>

    </div>
  );
}

function TopVideosSmall({ videos, names, className }: { videos: TopVideo[]; names: Record<string, string>; className?: string }) {
  return (
    <Section title="Top 5 video's" className={className}>
      {videos.length === 0 ? <EmptyState /> : (
        <ol className="space-y-2.5">
          {videos.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-2xl bg-popover p-2.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {v.thumbnail_url && <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold leading-snug">{v.title || "Zonder titel"}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{names[v.client_id] ?? "Klant"} · {NETWORK_LABELS[v.network as Network] ?? v.network}</p>
              </div>
              <div className="shrink-0 text-right tabular">
                <span className="text-sm font-semibold">{formatNumber(v.views)}</span>
                <p className="text-[11px] text-muted-foreground">weergaven</p>
              </div>
              {v.url && <a href={v.url} target="_blank" rel="noopener noreferrer" aria-label="Open post" className="round-btn h-8 w-8 shrink-0"><ArrowUpRight className="h-4 w-4" /></a>}
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

function ViewsChart({ data, names }: { data: NonNullable<ReturnType<typeof useHibeOverview>["data"]>; names: Record<string, string> }) {
  const [mode, setMode] = useState<"total" | "client">("total");
  const { daily, top } = useMemo(() => {
    const top = [...data.summaries].sort((a, b) => b.views - a.views).slice(0, 6).map((s) => s.clientId);
    const map = new Map<string, Record<string, number | string>>();
    for (const r of data.stats) {
      if (data.range.start && r.date < data.range.start) continue;
      const e = map.get(r.date) ?? { date: r.date, total: 0 };
      const v = r.views ?? 0;
      e.total = Number(e.total) + v;
      const k = top.includes(r.client_id) ? r.client_id : "other";
      e[k] = Number(e[k] ?? 0) + v;
      map.set(r.date, e);
    }
    return { daily: [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))), top };
  }, [data]);
  const lines = mode === "total"
    ? [{ key: "total", name: "Alle klanten", color: "hsl(var(--foreground))" }]
    : [...top.map((id, i) => ({ key: id, name: names[id] ?? "Klant", color: series(i) })), { key: "other", name: "Overige klanten", color: series(6) }];
  const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  return (
    <Section title="Weergaven alle klanten" aside={
      <div className="flex gap-1.5" role="group" aria-label="Weergave">
        {([["total", "Totaal"], ["client", "Per klant"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} aria-pressed={mode === k} className="chip-filter h-8 px-3 text-xs">{l}</button>
        ))}
      </div>
    }>
      {daily.length === 0 ? <EmptyState /> : (
        <>
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lines.map((l) => <span key={l.key} className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: l.color }} />{l.name}</span>)}
          </div>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ left: -12, right: 4, top: 4 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={short} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" minTickGap={24} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNumber(v)} />
                <Tooltip labelFormatter={(d) => short(String(d))} formatter={(v: number) => formatNumber(v)} contentStyle={{ borderRadius: 14, border: "none", fontSize: 12 }} />
                {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Section>
  );
}

type SortKey = "name" | "views" | "viewsChange" | "followers";
function Ranking({ rows, className, logos }: { rows: ClientSummary[]; className?: string; logos: Record<string, string> }) {
  const { clients } = useClient();
  const nav = useNavigate();
  const [sort, setSort] = useState<{ k: SortKey; desc: boolean }>({ k: "views", desc: true });
  const list = clients.map((c) => ({ c, s: rows.find((r) => r.clientId === c.id) }));
  const val = (x: (typeof list)[number]) => sort.k === "name" ? x.c.name.toLowerCase() : (x.s?.[sort.k] ?? -Infinity);
  list.sort((a, b) => { const A = val(a), B = val(b); const r = A < B ? -1 : A > B ? 1 : 0; return sort.desc ? -r : r; });
  const Th = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={cn("pb-2 font-normal", right ? "text-right" : "text-left")} aria-sort={sort.k === k ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button onClick={() => setSort({ k, desc: sort.k === k ? !sort.desc : k !== "name" })} className={cn("inline-flex items-center gap-1 hover:text-foreground", sort.k === k && "text-foreground")}>
        {label}<ArrowUpDown className="h-3 w-3" aria-hidden />
      </button>
    </th>
  );
  return (
    <Section title="Ranglijst klanten" className={className}>
      <div className="-mx-5 overflow-x-auto px-5 md:-mx-7 md:px-7">
        <table className="w-full min-w-[520px] table-fixed text-sm tabular">
          <colgroup><col /><col className="w-[104px]" /><col className="w-[100px]" /><col className="w-[96px]" /></colgroup>
          <thead><tr className="text-xs text-muted-foreground"><Th k="name" label="Klant" /><Th k="views" label="Weergaven" right /><Th k="viewsChange" label="Groei" right /><Th k="followers" label="Volgers" right /></tr></thead>
          <tbody>
            {list.map(({ c, s }) => (
              <tr key={c.id} onClick={() => nav(`/hibe/klant/${c.id}`)} className="cursor-pointer border-t border-border/70 hover:bg-popover">
                <td className="py-2.5">
                  <Link to={`/hibe/klant/${c.id}`} className="flex min-w-0 items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <ClientLogo url={c.logo_url ? logos[c.logo_url] : null} name={c.name} size={32} /><span className="truncate font-medium">{c.name}</span>
                  </Link>
                </td>
                <td className="py-2.5 text-right">{formatNumber(s?.views ?? null)}</td>
                <td className="py-2.5 text-right">{s?.viewsChange == null ? "–" : <Change value={s.viewsChange} />}</td>
                <td className="py-2.5 text-right">{formatNumber(s?.followers ?? null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Groei = weergaven t.o.v. de vorige periode.</p>
    </Section>
  );
}

function ActionNeeded({ actions, className }: { actions?: ReturnType<typeof useHibeActions>["data"]; className?: string }) {
  const { clients } = useClient();
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  if (!actions) return <Skeleton className={cn("h-64 rounded-lg", className)} />;
  const pending = Object.entries(actions.pending).sort((a, b) => b[1] - a[1]);
  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "nooit";
  const groups = [
    { title: "Te beoordelen", to: "/hibe/goedkeuringen", items: pending.map(([id, n]) => ({ key: id, text: name(id), badge: String(n) })) },
    { title: "Wijzigingsverzoeken", to: "/hibe/goedkeuringen", items: actions.changes.map((i) => ({ key: i.id, text: `${name(i.client_id)} · ${i.title}` })) },
    { title: "Aangevraagde contentmomenten", to: "/hibe/contentmomenten", items: actions.requested.map((m) => ({ key: m.id, text: `${name(m.client_id)} · ${m.title}` })) },
    { title: "Sync-problemen", to: "/hibe/klanten/beheer", items: actions.syncIssues.map((s) => ({ key: s.client_id, text: `${name(s.client_id)} · ${s.reason === "failed" ? "mislukt" : s.reason === "never" ? "nog nooit gesynct" : `laatste sync ${fmt(s.finished_at ?? s.started_at)}`}` })) },
  ];
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  return (
    <Section title="Actie nodig" className={className} aside={total > 0 ? <span className="growth">{total}</span> : undefined}>
      {total === 0 ? <EmptyState text="Alles is bijgewerkt." /> : (
        <div className="space-y-5">
          {groups.filter((g) => g.items.length).map((g) => (
            <div key={g.title}>
              <Link to={g.to} className="mb-2 flex items-center justify-between text-sm font-semibold hover:underline">{g.title}<span className="text-muted-foreground tabular">{g.items.length}</span></Link>
              <ul className="space-y-1.5">
                {g.items.slice(0, 5).map((i) => (
                  <li key={i.key} className="flex items-center justify-between gap-2 rounded-full bg-popover px-4 py-2 text-sm">
                    <span className="truncate">{i.text}</span>
                    {(i as { badge?: string }).badge && <span className="growth shrink-0">{(i as { badge?: string }).badge}</span>}
                  </li>
                ))}
                {g.items.length > 5 && <li className="px-4 text-xs text-muted-foreground">en nog {g.items.length - 5}</li>}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
