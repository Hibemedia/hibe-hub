import { useState } from "react";
import { PeriodSelect } from "@/components/PeriodSelect";
import { KpiBand, DailyChart, NetworkBreakdown, TopVideoList, EmptyState, PeriodSummary } from "@/components/StatsOverview";
import { useClientStats } from "@/hooks/useClientStats";
import { PeriodKey } from "@/lib/stats";
import { SyncButtons } from "@/components/SyncButtons";

export default function Performance() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { data, isLoading } = useClientStats(period);
  const stats = data?.stats ?? [];
  const range = data?.range;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{data?.client?.name ?? "\u00a0"}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Performance</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2"><SyncButtons /><PeriodSelect value={period} onChange={setPeriod} /></div>
      </div>

      {!isLoading && !data?.client ? (
        <section className="rounded-lg border bg-card"><EmptyState text="Nog geen data. Je account is nog niet aan een klant gekoppeld." /></section>
      ) : (
        <>
          <KpiBand stats={stats} range={range!} loading={isLoading || !range} />
          {range && <DailyChart stats={stats} range={range} />}
          {range && <NetworkBreakdown stats={stats} range={range} />}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TopVideoList videos={data?.videos ?? []} limit={10} className="lg:col-span-2" />
            <section className="space-y-2 lg:pt-1">
              <h2 className="text-base font-semibold">Samenvatting</h2>
              {range && <PeriodSummary stats={stats} range={range} videos={data?.videos ?? []} />}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
