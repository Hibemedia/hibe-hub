import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardWelcome } from "@/components/DashboardWelcome";
import { MedaillesWidget } from "@/components/MedaillesWidget";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";
import { PeriodSelect } from "@/components/PeriodSelect";
import { KpiGrid, NetworkBreakdown, TopVideoList, EmptyState } from "@/components/StatsOverview";
import { useClientStats } from "@/hooks/useClientStats";
import { PeriodKey, formatNumber, totalsFor } from "@/lib/stats";

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { data, isLoading } = useClientStats(period);
  const stats = data?.stats ?? [];
  const range = data?.range;
  const t = range ? totalsFor(stats, range.start, range.end) : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">DASHBOARD</h1>
          <p className="text-sm text-muted-foreground">{data?.client?.name ?? "Jouw prestaties in één oogopslag"}</p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {data?.client && t?.hasData && (
        <DashboardWelcome
          customerName={data.client.name}
          metrics={{
            totalViews: formatNumber(t.views),
            engagementRate: formatNumber(t.interactions),
            ctr: formatNumber(t.posts),
            organicImpressions: formatNumber(t.followers),
          }}
        />
      )}

      {!isLoading && !data?.client ? (
        <Card><EmptyState text="Nog geen data — je account is nog niet aan een klant gekoppeld." /></Card>
      ) : (
        <>
          <KpiGrid stats={stats} range={range!} loading={isLoading || !range} />
          {range && <NetworkBreakdown stats={stats} range={range} />}
        </>
      )}

      <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/video-approval")}>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <PlayCircle className="h-4 w-4 text-primary" /> Video-goedkeuring
          </CardTitle>
          <Button size="sm" variant="ghost">Bekijk video's</Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MedaillesWidget />
        <div className="space-y-2">
          <TopVideoList videos={data?.videos ?? []} />
          <Button variant="ghost" size="sm" onClick={() => navigate("/performance")}>Bekijk alles</Button>
        </div>
      </div>
    </div>
  );
}
