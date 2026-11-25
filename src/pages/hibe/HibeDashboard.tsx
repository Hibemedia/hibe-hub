import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowUpDown, ClipboardCheck, Hourglass, MessageSquare, Plus, Upload, Scissors, CalendarPlus, UserX, MessagesSquare, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PageHeader } from "@/components/PageHeader";
import { useMedia, useUploader } from "@/components/videos/useMedia";
import { useUnread } from "@/hooks/useChat";
import { useMyTeamRole } from "@/hooks/useTeamRole";
import { MyDay } from "@/components/dashboard/MyDay";
import { UpcomingContent } from "@/components/dashboard/UpcomingContent";
import { canSeeTotals, isNewGrowth } from "@/lib/dashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useHibeOverview, type ClientSummary, type TopVideo } from "@/hooks/useHibeOverview";
import { useMySettings } from "@/hooks/useMySettings";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { STEP_SLUG, type VideoStatus } from "@/lib/videos";
import { PeriodSelect } from "@/components/PeriodSelect";
import { Change } from "@/components/StatsOverview";
import { WeatherCard } from "@/components/WeatherCard";
import { SocialsChecklistPreview } from "@/components/SocialsChecklistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, NETWORK_LABELS, type Network, type PeriodKey } from "@/lib/stats";
import { cn } from "@/lib/utils";

const TZ = "Europe/Amsterdam";
export function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("nl-NL", { hour: "numeric", hour12: false, timeZone: TZ }).format(now));
  return h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond";
}

export default function HibeDashboard() {
  const [tab, setTab] = useState<"today" | "performance">("today");
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { clients } = useClient();
  const { data: me } = useMySettings();
  const { role, me: myId } = useMyTeamRole();
  const full = canSeeTotals(role);
  const { data, isLoading, isError } = useHibeOverview(period, full && tab === "performance", true);
  const media = useMedia();
  const up = useUploader();
  const { data: unread = {} } = useUnread();
  const { data: unassigned = 0 } = useQuery({ queryKey: ["edits", "unassigned-count"], refetchInterval: 60_000, queryFn: async () => {
    const { count, error } = await supabase.from("edits").select("id", { count: "exact", head: true }).neq("status", "delivered").is("editor_id", null);
    if (error) throw error;
    return count ?? 0;
  } });
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0);
  const vc = (s: VideoStatus) => media.live.filter((v) => v.status === s).length;
  const counters = [
    { label: "Te beoordelen", n: vc("internal_review"), to: `/hibe/videos/stap/${STEP_SLUG.internal_review}`, icon: ClipboardCheck },
    { label: "Wacht op klant", n: vc("client_review"), to: `/hibe/videos/stap/${STEP_SLUG.client_review}`, icon: Hourglass },
    { label: "Feedback te verwerken", n: vc("feedback"), to: `/hibe/videos/stap/${STEP_SLUG.feedback}`, icon: MessageSquare },
    { label: "Edits zonder editor", n: unassigned, to: "/hibe/edits?editor=none", icon: UserX },
    { label: "Ongelezen berichten", n: unreadTotal, to: "/hibe/chat", icon: MessagesSquare },
  ];
  const today = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date());
  const names = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  return <div className="mx-auto min-w-0 max-w-7xl space-y-5 p-4 md:p-6" {...up.dropProps}>
    <PageHeader title="Dashboard" action={<DropdownMenu>
      <DropdownMenuTrigger asChild><Button><Plus /><span>Nieuw</span><ChevronDown /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={up.openPicker}><Upload />Video uploaden</DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/hibe/edits?nieuw=1"><Scissors />Nieuwe edit</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/hibe/contentmomenten?nieuw=1"><CalendarPlus />Contentmoment toevoegen</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>} />
    <SegmentedControl label="Dashboardweergave" value={tab} onChange={(value) => { if (value === "today" || value === "performance") setTab(value); }} options={[{ value: "today", label: "Vandaag" }, { value: "performance", label: "Prestaties" }]} />
    {tab === "today" ? <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><h2 className="break-words text-xl font-semibold">{greeting()}{me?.name ? ` ${me.name}` : ""}</h2><p className="mt-1 text-sm text-muted-foreground">{today}</p></div>
        {me && <WeatherCard lat={me.lat} lon={me.lon} place={me.place} compact />}
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Acties vandaag">
        {counters.map((c) => <Button asChild key={c.label} variant="outline" className={cn("h-28 min-w-0 flex-col items-start justify-between whitespace-normal rounded-lg p-4 text-left last:col-span-2 lg:last:col-span-1", c.n > 0 ? "border-lime bg-filter-active hover:bg-lime/40" : "bg-muted/60 text-muted-foreground hover:bg-muted")}><Link to={c.to}>
          <span className="flex w-full items-start justify-between gap-2"><span className="text-sm leading-snug">{c.label}</span><c.icon className={cn("shrink-0", c.n > 0 ? "text-foreground" : "text-muted-foreground")} /></span><span className="text-3xl font-bold leading-none tabular">{c.n}</span>
        </Link></Button>)}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <MyDay me={myId} videos={media.live} loading={media.isLoading} />
        <UpcomingContent />
      </div>
      <SocialsChecklistPreview />
    </> : !full ? <p className="py-4 text-sm text-muted-foreground">De prestatiecijfers zijn beschikbaar voor beheerders.</p> : <>
      <div className="flex flex-wrap items-center justify-between gap-3"><PeriodSelect value={period} onChange={setPeriod} only={["7d", "30d", "90d"]} />{data && <span className="text-xs text-muted-foreground">{data.range.start} — {data.range.end}</span>}</div>
      {isError ? <p className="text-sm text-muted-foreground">De prestaties konden niet worden geladen.</p> : isLoading || !data ? <Skeleton className="h-80" /> : <>
        <section aria-label="Alle kanalen" className="border-t border-border pt-4"><h2 className="mb-4 text-lg font-semibold">Alle kanalen</h2>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="grid grid-cols-2 gap-x-5 gap-y-6 py-2">{[
              { label: "Weergaven", value: data.totals.views, change: <Change value={data.totals.viewsChange} /> },
              { label: "Volgers", value: data.totals.followers, change: null },
              { label: "Nieuwe volgers", value: data.totals.newFollowers, change: null },
              { label: "Posts", value: data.totals.posts, change: <Change value={data.totals.postsChange} /> },
            ].map((it) => <div key={it.label} className="min-w-0"><p className="break-words text-3xl font-semibold tabular">{formatNumber(it.value)}</p><p className="mt-1 text-sm text-muted-foreground">{it.label}</p>{it.change && <div className="mt-2 text-xs">{it.change}</div>}</div>)}</div>
            <ViewsChart data={data} names={names} />
          </div>
        </section>
        <TopVideosSmall videos={data.videos} names={names} />
        <Ranking rows={data.summaries} />
      </>}
    </>}
    {up.ui}
  </div>;
}

function TopVideosSmall({ videos, names }: { videos: TopVideo[]; names: Record<string, string> }) {
  return <section className="border-t border-border pt-4" aria-label="Top 5 video's"><h2 className="mb-3 text-lg font-semibold">Top 5 video's</h2>
    {videos.length === 0 ? <p className="text-sm text-muted-foreground">Geen video's gepubliceerd in deze periode.</p> : <ol className="divide-y divide-border">{videos.map((v, index) => {
      const content = <><span className="w-5 shrink-0 text-sm text-muted-foreground">{index + 1}</span><span className="h-14 w-12 shrink-0 overflow-hidden rounded-tag bg-muted">{v.thumbnail_url && <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</span><span className="min-w-0 flex-1 text-left"><span className="block break-words text-sm font-semibold">{v.title || "Zonder titel"}</span><span className="mt-1 flex flex-wrap items-center gap-2"><Tag>{names[v.client_id] ?? "Klant"}</Tag><span className="text-xs font-normal text-muted-foreground">{NETWORK_LABELS[v.network as Network] ?? v.network}</span></span></span><span className="shrink-0 text-right"><span className="block font-semibold tabular">{formatNumber(v.views)}</span><span className="text-xs font-normal text-muted-foreground">weergaven</span></span><ArrowUpRight /></>;
      return <li key={v.id}><Button asChild variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-tag px-2 py-3">{v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer" className="!no-underline">{content}</a> : <Link to={`/hibe/klant/${v.client_id}/performance`} className="!no-underline">{content}</Link>}</Button></li>;
    })}</ol>}
  </section>;
}

function ViewsChart({ data, names }: { data: NonNullable<ReturnType<typeof useHibeOverview>["data"]>; names: Record<string, string> }) {
  const [mode, setMode] = useState<"total" | "client">("total");
  const { daily, top } = useMemo(() => {
    const top = [...data.summaries].sort((a, b) => b.views - a.views).slice(0, 6).map((s) => s.clientId);
    const map = new Map<string, Record<string, number | string>>();
    for (const r of data.stats) {
      if ((data.range.start && r.date < data.range.start) || r.date > data.range.end) continue;
      const e = map.get(r.date) ?? { date: r.date, total: 0 };
      e.total = Number(e.total) + (r.views ?? 0);
      const k = top.includes(r.client_id) ? r.client_id : "other";
      e[k] = Number(e[k] ?? 0) + (r.views ?? 0);
      map.set(r.date, e);
    }
    return { daily: [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))), top };
  }, [data]);
  const color = (i: number) => `hsl(var(--series-${Math.min(i + 1, 7)}))`;
  const lines = mode === "total" ? [{ key: "total", name: "Alle klanten", color: "hsl(var(--foreground))" }] : [...top.map((id, i) => ({ key: id, name: names[id] ?? "Klant", color: color(i) })), { key: "other", name: "Overige klanten", color: color(6) }];
  const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  return <div className="min-w-0" aria-label="Weergavegrafiek"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Weergaven</h3><SegmentedControl label="Grafiekweergave" value={mode} onChange={(value) => { if (value === "total" || value === "client") setMode(value); }} options={[{ value: "total", label: "Totaal" }, { value: "client", label: "Per klant" }]} /></div>
    {mode === "client" && <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">{lines.map((l) => <span key={l.key}>{l.name}</span>)}</div>}
    {daily.length === 0 ? <p className="text-sm text-muted-foreground">Geen cijfers in deze periode.</p> : <div className="h-64" data-last-day={daily[daily.length - 1]?.date}><ResponsiveContainer width="100%" height="100%"><LineChart data={daily} margin={{ left: -12, right: 4, top: 4 }}>
      <CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="date" tickFormatter={short} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" minTickGap={24} /><YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNumber(v)} /><Tooltip labelFormatter={(d) => short(String(d))} formatter={(v: number) => formatNumber(v)} />{lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} />)}
    </LineChart></ResponsiveContainer></div>}
  </div>;
}

type SortKey = "name" | "views" | "viewsChange" | "followers" | "posts";
function Ranking({ rows }: { rows: ClientSummary[] }) {
  const { clients } = useClient();
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const nav = useNavigate();
  const [sort, setSort] = useState<{ k: SortKey; desc: boolean }>({ k: "views", desc: true });
  const list = clients.filter((c) => !c.video_only).map((c) => ({ c, s: rows.find((r) => r.clientId === c.id) }));
  const val = (x: typeof list[number]) => sort.k === "name" ? x.c.name.toLowerCase() : x.s?.[sort.k] ?? -Infinity;
  list.sort((a, b) => { const A = val(a), B = val(b); const r = A < B ? -1 : A > B ? 1 : 0; return sort.desc ? -r : r; });
  const th = (k: SortKey, label: string) => <th key={k} className={cn("py-2 font-normal", k !== "name" && "text-right")} aria-sort={sort.k === k ? (sort.desc ? "descending" : "ascending") : "none"}><Button variant="ghost" size="sm" onClick={() => setSort({ k, desc: sort.k === k ? !sort.desc : k !== "name" })} className="px-1 text-xs">{label}<ArrowUpDown /></Button></th>;
  return <section className="min-w-0 border-t border-border pt-4" aria-label="Ranglijst klanten"><h2 className="mb-3 text-lg font-semibold">Ranglijst klanten</h2><div className="overflow-x-auto"><table className="w-full min-w-[660px] text-sm tabular"><thead><tr className="text-left text-xs text-muted-foreground">{th("name", "Klant")}{th("views", "Weergaven")}{th("viewsChange", "Groei")}{th("followers", "Volgers")}{th("posts", "Gepubliceerde posts")}</tr></thead><tbody>{list.map(({ c, s }) => <tr key={c.id} tabIndex={0} aria-label={`Prestaties van ${c.name}`} onClick={() => nav(`/hibe/klant/${c.id}/performance`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(`/hibe/klant/${c.id}/performance`); } }} className="cursor-pointer border-t border-border transition-colors hover:bg-popover focus-visible:bg-popover focus-visible:outline-none">
    <td className="py-3"><Link to={`/hibe/klant/${c.id}/performance`} className="flex min-w-0 items-center gap-2 !no-underline"><ClientLogo url={c.logo_url ? logos[c.logo_url] : null} name={c.name} size={28} /><span className="max-w-64 break-words font-medium">{c.name}</span></Link></td><td className="py-3 text-right">{formatNumber(s?.views ?? null)}</td><td className="py-3 text-right">{s?.viewsChange == null ? "—" : isNewGrowth(s.viewsChange) ? <Tag variant="success">nieuw</Tag> : <Change value={s.viewsChange} />}</td><td className="py-3 text-right">{formatNumber(s?.followers ?? null)}</td><td className="py-3 text-right">{formatNumber(s?.posts ?? null)}</td>
  </tr>)}</tbody></table></div></section>;
}
