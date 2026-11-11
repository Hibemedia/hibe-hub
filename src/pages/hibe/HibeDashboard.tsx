import { PageHeader } from "@/components/PageHeader";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowUpDown, ClipboardCheck, Hourglass, MessageSquare } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useHibeOverview, useHibeActions, useTopVideosLastWeek, ClientSummary, type TopVideo } from "@/hooks/useHibeOverview";
import { useMySettings } from "@/hooks/useMySettings";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { useVideoItems } from "@/hooks/useVideos";
import { STEP_SLUG, type VideoStatus } from "@/lib/videos";
import { Moment, MOMENT_TYPES, STATUS_STYLE, MOMENT_STATUS } from "@/pages/ContentMoments";
import { PeriodSelect } from "@/components/PeriodSelect";
import { Section, EmptyState, Change } from "@/components/StatsOverview";
import { WeatherCard } from "@/components/WeatherCard";
import { SocialsChecklistCard } from "@/components/SocialsChecklistCard";
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
  const { data: weekVideos } = useTopVideosLastWeek();
  const { data: actions } = useHibeActions(clients.map((c) => c.id));
  const { data: videos = [] } = useVideoItems();
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const today = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date());
  const t = data?.totals;
  const names = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const counters: { label: string; status: VideoStatus; icon: typeof Hourglass }[] = [
    { label: "Te beoordelen door HIBE", status: "internal_review", icon: ClipboardCheck },
    { label: "Wacht op klant", status: "client_review", icon: Hourglass },
    { label: "Feedback te verwerken", status: "feedback", icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-8">
      <PageHeader title="Dashboard" />
      <p className="text-xl"><span className="font-semibold">{greeting()}{me?.name ? ` ${me.name}` : ""}</span> <span className="text-muted-foreground">· {today}</span></p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        {/* Rij 1: tellers + weer */}
        {counters.map((c) => {
          const n = videos.filter((v) => v.status === c.status).length;
          return (
            <Link key={c.status} to={`/hibe/videos/stap/${STEP_SLUG[c.status as VideoStatus]}`}
              className="group flex h-full flex-col justify-between gap-4 rounded-lg bg-card p-5 transition-colors hover:bg-popover sm:col-span-1 lg:col-span-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden />
              </div>
              <span className="text-[40px] font-light leading-none tracking-tight tabular">{n}</span>
            </Link>
          );
        })}
        <div className="lg:col-span-3">{me && <WeatherCard lat={me.lat} lon={me.lon} place={me.place} />}</div>

        {/* Rij 2: checklist + top 5 */}
        <SocialsChecklistCard className="h-full p-4 md:p-6 lg:col-span-8" />
        {weekVideos && <TopVideosSmall videos={weekVideos} names={names} className="h-full lg:col-span-4" />}

        {/* Rij 3: totalen + contentmomenten */}
        <Section title="Totaal alle kanalen" className="h-full lg:col-span-6" aside={<PeriodSelect value={period} onChange={setPeriod} only={["7d", "30d", "90d"]} />}>
          {isLoading || !t ? <Skeleton className="h-32 rounded-lg" /> : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Weergaven", value: t.views, change: <Change value={t.viewsChange} /> },
                { label: "Volgers", value: t.followers, change: <span className="text-muted-foreground">alle kanalen</span> },
                { label: "Nieuwe volgers", value: t.newFollowers, change: <Change value={t.newFollowers} suffix="" /> },
                { label: "Posts", value: t.posts, change: <Change value={t.postsChange} /> },
              ].map((it) => (
                <div key={it.label} className="rounded-lg bg-popover p-4">
                  <p className="text-[28px] font-light leading-none tracking-tight tabular">{formatNumber(it.value)}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{it.label}</p>
                  <div className="mt-2 text-xs tabular">{it.change}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
        <UpcomingMoments names={names} className="h-full lg:col-span-6" />
      </div>

      {data && <ViewsChart data={data} names={names} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {data && <Ranking rows={data.summaries} className="xl:col-span-3" logos={logos} />}
        <ActionNeeded className="xl:col-span-2" actions={actions} />
      </div>
    </div>
  );
}

function UpcomingMoments({ names, className }: { names: Record<string, string>; className?: string }) {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["content-moments", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_moments").select("*").order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Moment[];
    },
  });
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const upcoming = all.filter((m) => m.status !== "afgerond" && m.status !== "geannuleerd" && m.date && m.date >= todayStr).slice(0, 6);
  return (
    <Section title="Komende contentmomenten" className={className}
      aside={<Link to="/hibe/contentmomenten" className="round-btn h-8 w-8" aria-label="Alle contentmomenten"><ArrowUpRight className="h-4 w-4" /></Link>}>
      {isLoading ? <Skeleton className="h-32 rounded-lg" /> : upcoming.length === 0 ? <EmptyState text="Geen contentmomenten of draaidagen gepland." /> : (
        <ul className="space-y-2">
          {upcoming.map((m) => (
            <li key={m.id}>
              <Link to="/hibe/contentmomenten" className="flex items-center gap-3.5 rounded-lg bg-popover p-2.5 transition-colors hover:bg-muted">
                <div className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl", m.date === todayStr ? "bg-lime text-lime-foreground" : "bg-foreground text-background")}>
                  <span className="text-[10px] font-semibold uppercase leading-none opacity-80">{new Date(m.date! + "T00:00:00").toLocaleDateString("nl-NL", { month: "short" }).replace(".", "")}</span>
                  <span className="mt-0.5 text-xl font-bold leading-none tabular">{new Date(m.date! + "T00:00:00").getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-snug">{m.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {names[m.client_id] ?? "Klant"} · {new Date(m.date! + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "long" })}{m.start_time ? ` ${String(m.start_time).slice(0, 5)}` : ""}{m.location ? ` · ${m.location}` : ""}
                  </p>
                </div>
                <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[m.status])}>{MOMENT_STATUS[m.status]}</span>
                  <span className="text-[11px] text-muted-foreground">{MOMENT_TYPES[m.type]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function TopVideosSmall({ videos, names, className }: { videos: TopVideo[]; names: Record<string, string>; className?: string }) {
  return (
    <Section title="Top 5 video's · vorige week" className={className}>
      {videos.length === 0 ? <EmptyState text="Geen video's gepubliceerd vorige week." /> : (
        <ol className="space-y-2.5">
          {videos.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-lg bg-popover p-2.5">
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
      <div className="relative -mx-5 overflow-x-auto px-5 md:-mx-7 md:px-7">
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
    { title: "Ter controle bij klant", to: "/hibe/videos/stap/ter-controle-bij-klant", items: pending.map(([id, n]) => ({ key: id, text: name(id), badge: String(n) })) },
    { title: "Feedback verwerken", to: "/hibe/videos/stap/feedback-verwerken", items: actions.changes.map((i) => ({ key: i.id, text: `${name(i.client_id)} · ${i.title}` })) },
    { title: "Aangevraagde contentmomenten", to: "/hibe/contentmomenten", items: actions.requested.map((m) => ({ key: m.id, text: `${name(m.client_id)} · ${m.title}` })) },
    { title: "Sync-problemen", to: "/hibe/klanten/beheer", items: actions.syncIssues.map((s) => ({ key: s.client_id, text: `${name(s.client_id)} · ${s.reason === "failed" ? "mislukt" : s.reason === "never" ? "nog nooit gesynct" : `laatste sync ${fmt(s.finished_at ?? s.started_at)}`}` })) },
  ];
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  return (
    <Section title="Actie nodig" className={cn("self-start xl:sticky xl:top-20", className)} aside={total > 0 ? <span className="growth">{total}</span> : undefined}>
      {total === 0 && <p className="mb-3 text-sm text-muted-foreground">Alles is bijgewerkt. Hier verschijnt wat jouw aandacht nodig heeft.</p>}
      <div className="divide-y divide-border/70">
        {groups.map((g) => (
          <div key={g.title} className="py-3 first:pt-0 last:pb-0">
            <Link to={g.to} className="group flex items-center justify-between gap-2 text-sm">
              <span className={cn("font-semibold group-hover:underline", !g.items.length && "font-medium text-muted-foreground")}>{g.title}</span>
              {g.items.length ? <span className="min-w-6 rounded-full bg-foreground px-2 text-center text-xs font-bold leading-6 text-background tabular">{g.items.length}</span>
                : <span className="text-xs text-muted-foreground">Niets open</span>}
            </Link>
            {g.items.length > 0 && (
              <ul className="mt-2 space-y-1">
                {g.items.slice(0, 4).map((i) => (
                  <li key={i.key}><Link to={g.to} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-popover">
                    <span className="truncate">{i.text}</span>
                    {(i as { badge?: string }).badge && <span className="shrink-0 text-xs text-muted-foreground tabular">{(i as { badge?: string }).badge} video{(i as { badge?: string }).badge === "1" ? "" : "'s"}</span>}
                  </Link></li>
                ))}
                {g.items.length > 4 && <li><Link to={g.to} className="px-2 text-xs text-muted-foreground hover:text-foreground">en nog {g.items.length - 4} →</Link></li>}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
