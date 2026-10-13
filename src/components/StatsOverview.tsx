import { useMemo } from "react";
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
    <section className={cn("rounded-lg border bg-card", className)}>
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {aside}
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${formatNumber(n)}`;

function Change({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value == null) return <span className="text-muted-foreground">geen vergelijking</span>;
  return (
    <span className={value >= 0 ? "text-success" : "text-destructive"}>
      {suffix != null ? fmtSigned(value) + suffix : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`}
    </span>
  );
}

export function KpiBand({ stats, range, loading }: { stats: DailyStat[]; range: Range; loading?: boolean }) {
  if (loading) return <Skeleton className="h-28 rounded-lg" />;
  const cur = totalsFor(stats, range.start, range.end);
  if (!cur.hasData) return <section className="rounded-lg border bg-card"><EmptyState /></section>;
  const prev = range.prevStart ? totalsFor(stats, range.prevStart, range.prevEnd) : null;
  const pc = (c: number, p?: number | null) => (prev?.hasData ? pctChange(c, p) : null);
  const items = [
    { label: "Volgers", value: cur.followers, change: <Change value={cur.followersGrowth} suffix=" deze periode" /> },
    { label: "Weergaven", value: cur.views, change: <><Change value={pc(cur.views, prev?.views)} /> <span className="text-muted-foreground">vs. vorige</span></> },
    { label: "Interacties", value: cur.interactions, change: <><Change value={pc(cur.interactions, prev?.interactions)} /> <span className="text-muted-foreground">vs. vorige</span></> },
    { label: "Posts", value: cur.posts, change: <><Change value={pc(cur.posts, prev?.posts)} /> <span className="text-muted-foreground">vs. vorige</span></> },
  ];
  return (
    <section className="grid grid-cols-2 rounded-lg border bg-card lg:grid-cols-4">
      {items.map((it, i) => (
        <div key={it.label} className={cn("p-4 md:p-5", i % 2 === 1 && "border-l", i >= 2 && "border-t lg:border-t-0", i === 2 && "lg:border-l")}>
          <div className="text-sm text-muted-foreground">{it.label}</div>
          <div className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">{formatNumber(it.value)}</div>
          <div className="mt-1 text-xs tabular">{it.change}</div>
        </div>
      ))}
    </section>
  );
}

export function DailyChart({ stats, range }: { stats: DailyStat[]; range: Range }) {
  const daily = useMemo(() => {
    const map = new Map<string, { date: string; views: number; interactions: number }>();
    for (const r of stats) {
      if (range.start && r.date < range.start) continue;
      const e = map.get(r.date) ?? { date: r.date, views: 0, interactions: 0 };
      e.views += r.views ?? 0;
      e.interactions += r.interactions ?? 0;
      map.set(r.date, e);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [stats, range]);
  const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  return (
    <Section
      title="Weergaven en interacties per dag"
      aside={
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-foreground" />Weergaven</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-primary" />Interacties</span>
        </div>
      }
    >
      {daily.length === 0 ? <EmptyState /> : (
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ left: -12, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={short} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" minTickGap={24} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNumber(v)} />
              <Tooltip
                labelFormatter={(d) => short(String(d))}
                formatter={(v: number) => formatNumber(v)}
                contentStyle={{ borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="views" name="Weergaven" stroke="hsl(var(--foreground))" strokeWidth={1.75} dot={false} />
              <Line type="monotone" dataKey="interactions" name="Interacties" stroke="hsl(var(--primary))" strokeWidth={1.75} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
        <table className="w-full text-sm tabular">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="pb-2 font-normal">Platform</th>
              <th className="pb-2 text-right font-normal">Volgers</th>
              <th className="pb-2 text-right font-normal">Groei</th>
              <th className="hidden pb-2 text-right font-normal sm:table-cell">Weergaven</th>
              <th className="hidden pb-2 text-right font-normal sm:table-cell">Posts</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(({ n, t }) => (
              <tr key={n} className="border-t">
                <td className="py-3"><span className="flex items-center gap-2"><PlatformDot network={n} />{NETWORK_LABELS[n]}</span></td>
                <td className="py-3 text-right font-medium">{formatNumber(t.followers)}</td>
                <td className="py-3 text-right">{t.followersGrowth == null ? "–" : <Change value={t.followersGrowth} suffix="" />}</td>
                <td className="hidden py-3 text-right sm:table-cell">{formatNumber(t.views)}</td>
                <td className="hidden py-3 text-right sm:table-cell">{formatNumber(t.posts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

export function TopVideoList({ videos, limit = 5, className, aside }: { videos: VideoRow[]; limit?: number; className?: string; aside?: React.ReactNode }) {
  return (
    <Section title="Best bekeken video's" className={className} aside={aside}>
      {videos.length === 0 ? <EmptyState /> : (
        <ol className="-my-2 divide-y">
          {videos.slice(0, limit).map((v) => {
            const inner = (
              <>
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {v.thumbnail_url && <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.title || "Zonder titel"}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PlatformDot network={v.network} />
                    {NETWORK_LABELS[v.network as Network] ?? v.network}
                    {v.published_at && <span>· {new Date(v.published_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</span>}
                  </p>
                </div>
                <div className="text-right tabular">
                  <div className="text-sm font-semibold">{formatNumber(v.views)}</div>
                  <div className="text-xs text-muted-foreground">weergaven</div>
                </div>
              </>
            );
            return (
              <li key={v.id}>
                {v.url ? (
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</a>
                ) : (
                  <div className="flex items-center gap-3 py-2">{inner}</div>
                )}
              </li>
            );
          })}
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
