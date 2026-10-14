import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DailyStat, NETWORK_LABELS, Network, formatNumber, pctChange, totalsFor } from "@/lib/stats";
import type { VideoRow } from "@/hooks/useClientStats";
import { cn } from "@/lib/utils";

type Range = { start: string | null; end: string; prevStart: string | null; prevEnd: string | null };

export const platformColor = (n: string) => `hsl(var(--platform-${n}, var(--muted-foreground)))`;

export function PlatformDot({ network }: { network: string }) {
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: platformColor(network) }} aria-hidden />;
}

export function EmptyState({ text = "Nog geen data" }: { text?: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>;
}

export function Section({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg bg-card p-5 md:p-7", className)}>
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
        {aside}
      </header>
      <div>{children}</div>
    </section>
  );
}

const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${formatNumber(n)}`;

export function Change({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value == null) return <span className="text-muted-foreground">geen vergelijking</span>;
  const label = suffix != null ? formatNumber(Math.abs(value)) + suffix : `${Math.abs(value).toFixed(1)}%`;
  if (value >= 0) return <span className="growth"><span aria-hidden>↑</span><span className="sr-only">plus </span>{label}</span>;
  return <span className="inline-flex items-center gap-0.5 rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background"><span aria-hidden>↓</span><span className="sr-only">min </span>{label}</span>;
}

export function KpiBand({ stats, range, loading }: { stats: DailyStat[]; range: Range; loading?: boolean }) {
  if (loading) return <Skeleton className="h-40 rounded-lg" />;
  const cur = totalsFor(stats, range.start, range.end);
  if (!cur.hasData) return <section className="rounded-lg bg-card"><EmptyState /></section>;
  const prev = range.prevStart ? totalsFor(stats, range.prevStart, range.prevEnd) : null;
  const pc = (c: number, p?: number | null) => (prev?.hasData ? pctChange(c, p) : null);
  const items = [
    { label: "Volgers", value: cur.followers, change: <><Change value={cur.followersGrowth} suffix="" /> <span className="text-muted-foreground">deze periode</span></> },
    { label: "Weergaven", value: cur.views, change: <><Change value={pc(cur.views, prev?.views)} /> <span className="text-muted-foreground">vs. vorige</span></> },
    { label: "Interacties", value: cur.interactions, change: <><Change value={pc(cur.interactions, prev?.interactions)} /> <span className="text-muted-foreground">vs. vorige</span></> },
    { label: "Posts", value: cur.posts, change: <><Change value={pc(cur.posts, prev?.posts)} /> <span className="text-muted-foreground">vs. vorige</span></> },
  ];
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[44px] font-light leading-none tracking-tight tabular xl:text-[56px]">{formatNumber(it.value)}</span>
            <span className="text-base text-muted-foreground">{it.label}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs tabular">{it.change}</div>
        </div>
      ))}
    </section>
  );
}

export function DailyChart({ stats, range }: { stats: DailyStat[]; range: Range }) {
  const [mode, setMode] = useState<"total" | "net">("total");
  const nets = useMemo(() => (Object.keys(NETWORK_LABELS) as Network[]).filter((n) => stats.some((r) => r.network === n && (r.views ?? 0) > 0 && (!range.start || r.date >= range.start))), [stats, range]);
  const daily = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    for (const r of stats) {
      if (range.start && r.date < range.start) continue;
      const e = map.get(r.date) ?? { date: r.date, views: 0, interactions: 0 };
      e.views = Number(e.views) + (r.views ?? 0);
      e.interactions = Number(e.interactions) + (r.interactions ?? 0);
      e[r.network] = Number(e[r.network] ?? 0) + (r.views ?? 0);
      map.set(r.date, e);
    }
    return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [stats, range]);
  const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  const lines = mode === "total"
    ? [{ key: "views", name: "Weergaven", color: "hsl(var(--foreground))", axis: "l", dash: undefined as string | undefined }, { key: "interactions", name: "Interacties (rechter as)", color: "hsl(var(--interactions))", axis: "r", dash: "6 4" as string | undefined }]
    : nets.map((n) => ({ key: n, name: NETWORK_LABELS[n], color: platformColor(n), axis: "l", dash: undefined as string | undefined }));
  return (
    <Section
      title={mode === "total" ? "Weergaven en interacties per dag" : "Weergaven per kanaal per dag"}
      aside={
        <div className="flex gap-1.5" role="group" aria-label="Weergave">
          {([["total", "Totaal"], ["net", "Per kanaal"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} aria-pressed={mode === k}
              className="chip-filter h-8 px-3 text-xs">{l}</button>
          ))}
        </div>
      }
    >
      {daily.length === 0 ? <EmptyState /> : (
        <>
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lines.map((l) => <span key={l.key} className="flex items-center gap-1.5"><svg width="20" height="4" aria-hidden><line x1="0" y1="2" x2="20" y2="2" stroke={l.color} strokeWidth="2" strokeDasharray={l.dash} /></svg>{l.name}</span>)}
          </div>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ left: -12, right: mode === "total" ? -12 : 4, top: 4 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={short} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" minTickGap={24} />
                <YAxis yAxisId="l" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNumber(v)} />
                {mode === "total" && <YAxis yAxisId="r" orientation="right" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNumber(v)} />}
                <Tooltip labelFormatter={(d) => short(String(d))} formatter={(v: number) => formatNumber(v)}
                  contentStyle={{ borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} yAxisId={l.axis} stroke={l.color} strokeWidth={2} strokeDasharray={l.dash} dot={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Section>
  );
}

export function NetworkBreakdown({ stats, range, className }: { stats: DailyStat[]; range: Range; className?: string }) {
  const networks = (Object.keys(NETWORK_LABELS) as Network[])
    .map((n) => ({ n, t: totalsFor(stats, range.start, range.end, n) }))
    .filter((x) => x.t.hasData);
  return (
    <Section title="Per platform" className={className}>
      {networks.length === 0 ? <EmptyState /> : (
        <div className="-mx-4 overflow-x-auto px-4 md:-mx-5 md:px-5">
        <table className="w-full min-w-[520px] table-fixed text-sm tabular">
          <colgroup>
            <col />
            <col className="w-[96px]" />
            <col className="w-[88px]" />
            <col className="w-[104px]" />
            <col className="w-[64px]" />
          </colgroup>
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="pb-2 text-left font-normal">Platform</th>
              <th className="pb-2 text-right font-normal">Volgers</th>
              <th className="pb-2 text-right font-normal">Groei</th>
              <th className="pb-2 text-right font-normal">Weergaven</th>
              <th className="pb-2 text-right font-normal">Posts</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(({ n, t }) => (
              <tr key={n} className="border-t border-border/70">
                <td className="truncate py-3"><span className="flex items-center gap-2"><PlatformDot network={n} />{NETWORK_LABELS[n]}</span></td>
                <td className="py-3 text-right font-medium">{formatNumber(t.followers)}</td>
                <td className="py-3 text-right">{t.followersGrowth == null ? "–" : <Change value={t.followersGrowth} suffix="" />}</td>
                <td className="py-3 text-right">{formatNumber(t.views)}</td>
                <td className="py-3 text-right">{formatNumber(t.posts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Section>
  );
}

export function TopVideoList({ videos, limit = 5, className, aside }: { videos: VideoRow[]; limit?: number; className?: string; aside?: React.ReactNode }) {
  return (
    <Section title="Best bekeken video's" className={className} aside={aside}>
      {videos.length === 0 ? <EmptyState /> : (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {videos.slice(0, limit).map((v) => (
            <li key={v.id} className="relative flex gap-4 rounded-lg bg-popover p-3">
              <div className="h-28 w-20 shrink-0 overflow-hidden rounded-[14px] bg-muted">
                {v.thumbnail_url && <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col pr-10">
                <p className="line-clamp-2 text-base font-semibold leading-snug">{v.title || "Zonder titel"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="chip">{NETWORK_LABELS[v.network as Network] ?? v.network}</span>
                  {v.published_at && <span className="chip">{new Date(v.published_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</span>}
                </div>
                <div className="mt-auto flex items-baseline gap-1.5 pt-2 tabular">
                  <span className="text-2xl font-light">{formatNumber(v.views)}</span>
                  <span className="text-xs text-muted-foreground">weergaven</span>
                </div>
              </div>
              {v.url && (
                <a href={v.url} target="_blank" rel="noopener noreferrer" aria-label="Open post" className="round-btn absolute right-3 top-3 h-9 w-9 bg-card">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

/** Plain-language recap built from the real numbers. */
export function PeriodSummary({ stats, range, videos }: { stats: DailyStat[]; range: Range; videos: VideoRow[] }) {
  const lines: string[] = [];
  const nets = (Object.keys(NETWORK_LABELS) as Network[])
    .map((n) => ({ n, t: totalsFor(stats, range.start, range.end, n) }))
    .filter((x) => x.t.hasData && x.t.followersGrowth != null);
  const best = [...nets].sort((a, b) => (b.t.followersGrowth ?? 0) - (a.t.followersGrowth ?? 0))[0];
  if (best && (best.t.followersGrowth ?? 0) > 0) {
    lines.push(`${NETWORK_LABELS[best.n]} groeide het hardst, met ${formatNumber(best.t.followersGrowth)} ${best.n === "yt" ? "abonnees" : "volgers"} erbij.`);
  }
  const shrink = nets.filter((x) => (x.t.followersGrowth ?? 0) < 0);
  if (shrink.length) lines.push(`${shrink.map((x) => NETWORK_LABELS[x.n]).join(" en ")} verloor volgers.`);
  const top = videos[0];
  if (top) lines.push(`De best bekeken video was "${top.title || "zonder titel"}" op ${NETWORK_LABELS[top.network as Network] ?? top.network}, met ${formatNumber(top.views)} weergaven.`);
  if (!lines.length) return null;
  return <p className="max-w-3xl text-[15px] leading-relaxed text-foreground/80">{lines.join(" ")}</p>;
}
