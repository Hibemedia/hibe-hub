import { useMemo, useState } from "react";
import { AIInsightsWidget } from "@/components/AIInsightsWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PeriodSelect } from "@/components/PeriodSelect";
import { KpiGrid, NetworkBreakdown, TopVideoList, EmptyState } from "@/components/StatsOverview";
import { useClientStats } from "@/hooks/useClientStats";
import { PeriodKey } from "@/lib/stats";

export default function Performance() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { data, isLoading } = useClientStats(period);
  const stats = data?.stats ?? [];
  const range = data?.range;

  const daily = useMemo(() => {
    if (!range) return [];
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

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Performance</h1>
          <p className="text-sm text-muted-foreground">{data?.client?.name ?? "Resultaten per periode en platform"}</p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {!isLoading && !data?.client ? (
        <Card><EmptyState text="Nog geen data — je account is nog niet aan een klant gekoppeld." /></Card>
      ) : (
        <>
          <KpiGrid stats={stats} range={range!} loading={isLoading || !range} />
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Weergaven & interacties per dag</CardTitle></CardHeader>
            <CardContent>
              {daily.length === 0 ? <EmptyState /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" name="Weergaven" stroke="hsl(var(--primary))" dot={false} />
                      <Line type="monotone" dataKey="interactions" name="Interacties" stroke="hsl(var(--accent-foreground))" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          {range && <NetworkBreakdown stats={stats} range={range} />}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopVideoList videos={data?.videos ?? []} limit={5} />
        <AIInsightsWidget />
      </div>
    </div>
  );
}
