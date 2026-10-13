import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PeriodSelect } from "@/components/PeriodSelect";
import { KpiBand, DailyChart, NetworkBreakdown, TopVideoList, EmptyState, PeriodSummary } from "@/components/StatsOverview";
import { useClientStats } from "@/hooks/useClientStats";
import { PeriodKey } from "@/lib/stats";

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { data, isLoading } = useClientStats(period);
  const stats = data?.stats ?? [];
  const range = data?.range;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{data?.client?.name ?? "\u00a0"}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Overzicht</h1>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {!isLoading && !data?.client ? (
        <section className="rounded-lg border bg-card"><EmptyState text="Nog geen data. Je account is nog niet aan een klant gekoppeld." /></section>
      ) : (
        <>
          {range && <PeriodSummary stats={stats} range={range} videos={data?.videos ?? []} />}
          <KpiBand stats={stats} range={range!} loading={isLoading || !range} />
          {range && <DailyChart stats={stats} range={range} />}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {range && <NetworkBreakdown stats={stats} range={range} className="lg:col-span-2" />}
            <TopVideoList
              videos={data?.videos ?? []}
              className="lg:col-span-3"
              aside={<Link to="/performance" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">Alles <ArrowRight className="h-3.5 w-3.5" /></Link>}
            />
          </div>
          <Link to="/video-approval" className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted/40 md:px-5">
            <span>Video's ter goedkeuring bekijken</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </>
      )}
    </div>
  );
}
