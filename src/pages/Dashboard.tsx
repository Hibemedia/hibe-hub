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
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-8">
      <div className="flex flex-col gap-4">
        <div>
                    <h1 className="wordmark">Overzicht</h1>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {!isLoading && !data?.client ? (
        <section className="rounded-lg bg-card"><EmptyState text="Nog geen data. Je account is nog niet aan een klant gekoppeld." /></section>
      ) : (
        <>
          {range && <PeriodSummary stats={stats} range={range} videos={data?.videos ?? []} />}
          <KpiBand stats={stats} range={range!} loading={isLoading || !range} />
          {range && <DailyChart stats={stats} range={range} />}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            {range && <NetworkBreakdown stats={stats} range={range} className="xl:col-span-2" />}
            <TopVideoList
              videos={data?.videos ?? []}
              className="xl:col-span-3"
              aside={<Link to="/performance" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">Alles <ArrowRight className="h-3.5 w-3.5" /></Link>}
            />
          </div>
          <Link to="/video-approval" className="flex items-center justify-between rounded-full bg-foreground py-2 pl-6 pr-2 text-sm font-medium text-background">
            <span>Video's ter goedkeuring bekijken</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground"><ArrowRight className="h-4 w-4" /></span>
          </Link>
        </>
      )}
    </div>
  );
}
