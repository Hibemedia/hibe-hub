import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, Heart, Film } from "lucide-react";
import { DailyStat, NETWORK_LABELS, Network, formatNumber, formatPct, pctChange, totalsFor } from "@/lib/stats";
import type { VideoRow } from "@/hooks/useClientStats";

type Range = { start: string | null; end: string; prevStart: string | null; prevEnd: string | null };

export function EmptyState({ text = "Nog geen data" }: { text?: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>;
}

export function KpiGrid({ stats, range, loading }: { stats: DailyStat[]; range: Range; loading?: boolean }) {
  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  const cur = totalsFor(stats, range.start, range.end);
  if (!cur.hasData) return <Card><CardContent><EmptyState /></CardContent></Card>;
  const prev = range.prevStart ? totalsFor(stats, range.prevStart, range.prevEnd) : null;
  const ch = (c: number, p?: number | null) => {
    const v = prev?.hasData ? pctChange(c, p) : null;
    return { change: formatPct(v), changeType: (v == null ? "neutral" : v >= 0 ? "positive" : "negative") as "positive" | "negative" | "neutral" };
  };
  const growth = cur.followersGrowth;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard title="Volgers" value={formatNumber(cur.followers)} icon={Users}
        change={growth == null ? "geen vergelijking" : `${growth >= 0 ? "+" : ""}${formatNumber(growth)} groei`}
        changeType={growth == null ? "neutral" : growth >= 0 ? "positive" : "negative"} />
      <MetricCard title="Weergaven" value={formatNumber(cur.views)} icon={Eye} {...ch(cur.views, prev?.views)} />
      <MetricCard title="Interacties" value={formatNumber(cur.interactions)} icon={Heart} {...ch(cur.interactions, prev?.interactions)} />
      <MetricCard title="Posts" value={formatNumber(cur.posts)} icon={Film} {...ch(cur.posts, prev?.posts)} />
    </div>
  );
}

export function NetworkBreakdown({ stats, range }: { stats: DailyStat[]; range: Range }) {
  const networks = (Object.keys(NETWORK_LABELS) as Network[])
    .map((n) => ({ n, t: totalsFor(stats, range.start, range.end, n) }))
    .filter((x) => x.t.hasData);
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Per platform</CardTitle></CardHeader>
      <CardContent>
        {networks.length === 0 ? <EmptyState /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {networks.map(({ n, t }) => (
              <div key={n} className="rounded-xl border p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">{NETWORK_LABELS[n]}</div>
                <div className="text-2xl font-bold">{formatNumber(t.followers)}</div>
                <div className="text-xs text-muted-foreground">{n === "yt" ? "abonnees" : "volgers"}{t.followersGrowth != null && <span className={t.followersGrowth >= 0 ? "text-success" : "text-destructive"}> ({t.followersGrowth >= 0 ? "+" : ""}{formatNumber(t.followersGrowth)})</span>}</div>
                <div className="text-xs text-muted-foreground">{formatNumber(t.views)} weergaven · {formatNumber(t.posts)} posts</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TopVideoList({ videos, limit = 5 }: { videos: VideoRow[]; limit?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Top video's</CardTitle></CardHeader>
      <CardContent>
        {videos.length === 0 ? <EmptyState /> : (
          <ol className="space-y-2">
            {videos.slice(0, limit).map((v, i) => (
              <li key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{v.title || "Zonder titel"}</p>
                  <p className="text-xs text-muted-foreground">
                    {NETWORK_LABELS[v.network as Network] ?? v.network}
                    {v.published_at ? ` · ${new Date(v.published_at).toLocaleDateString("nl-NL")}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="text-sm font-semibold text-foreground">{formatNumber(v.views)}</div>
                  {formatNumber(v.likes)} likes · {formatNumber(v.comments)} reacties
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
