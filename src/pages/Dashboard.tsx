import { Tag } from "@/components/ui/tag";
import { PageHeader } from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, Play } from "lucide-react";
import { KpiBand, EmptyState, DailyChart, NetworkBreakdown, TopVideoList } from "@/components/StatsOverview";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodSelect } from "@/components/PeriodSelect";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientStats } from "@/hooks/useClientStats";
import { useOverviewVideo } from "@/hooks/useOverviewDetails";
import { usePendingReviewCount } from "@/hooks/useReviews";
import { NETWORK_LABELS, formatNumber, type Network, type PeriodKey } from "@/lib/stats";
import { useBase } from "@/lib/paths";
import { useClient } from "@/context/ClientContext";
import { BarChart3 } from "lucide-react";

/** Shown when a client has no statistics yet (new or video-only): makes clear where they will appear. */
function StatsComing() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-control bg-muted"><BarChart3 className="h-6 w-6 text-muted-foreground" aria-hidden /></span>
      <h2 className="text-lg font-semibold">Je statistieken komen hier te staan</h2>
      <p className="max-w-md text-sm text-muted-foreground">Zodra HIBE je kanalen koppelt en er cijfers binnenkomen, zie je hier je volgers, weergaven en welke video het best deed.</p>
    </section>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useClientStats("30d" as PeriodKey);
  const stats = data?.stats ?? [];
  const range = data?.range;
  const base = useBase();
  const video = useOverviewVideo(range);
  const pending = usePendingReviewCount();
  const n = pending.data ?? 0;
  const best = video.data;
  const { client } = useClient();
  const noStats = !!client?.video_only || (!isLoading && !isError && !stats.length);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <PageHeader title="Home" />
      <Tabs defaultValue="vandaag" className="space-y-5">
        <TabsList><TabsTrigger value="vandaag">Vandaag</TabsTrigger><TabsTrigger value="prestaties">Prestaties</TabsTrigger></TabsList>
        <TabsContent value="prestaties" className="mt-0"><ClientPerformanceTab /></TabsContent>
        <TabsContent value="vandaag" className="mt-0 space-y-5">
      <section className="flex flex-col gap-4 rounded-lg bg-foreground p-5 text-background sm:flex-row sm:items-center sm:justify-between md:p-6" aria-live="polite">
        <div>
          <p className="text-2xl font-semibold">{pending.isLoading ? "…" : n === 0 ? "Er wacht niets op jouw beoordeling" : `${n} video${n === 1 ? "" : "'s"} wacht${n === 1 ? "" : "en"} op jouw beoordeling`}</p>
          <p className="mt-1 text-sm text-background/70">{n === 0 ? "Zodra HIBE nieuwe video's klaarzet, verschijnen ze hier." : "Bekijk ze en keur goed of vraag een wijziging."}</p>
        </div>
        <Button asChild className="shrink-0 bg-lime text-lime-foreground hover:bg-lime/90"><Link to={n ? `${base}/videos/beoordelen` : `${base}/videos`}>{n ? <><Play aria-hidden />Start beoordelen</> : <><Check aria-hidden />Bekijk video's</>}</Link></Button>
      </section>

      {(noStats) ? <StatsComing /> : isError ? (
        <EmptyState text="De cijfers konden niet worden geladen. Probeer het later opnieuw." />
      ) : !isLoading && !data?.client ? (
        <EmptyState text="Nog geen data. Je account is nog niet aan een klant gekoppeld." />
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold">Afgelopen 30 dagen</h2>
            <Button asChild variant="ghost" size="sm"><Link to={`${base}/performance`}>Alle resultaten <ArrowRight aria-hidden /></Link></Button>
          </div>
          {range ? <KpiBand stats={stats} range={range} loading={isLoading} /> : <Skeleton className="h-40 rounded-lg" />}
          {best && (
            <section aria-labelledby="best-video-title" className="space-y-3">
              <h2 id="best-video-title" className="text-xl font-semibold">Best bekeken video</h2>
              <article className="grid overflow-hidden rounded-lg bg-card sm:grid-cols-[200px_minmax(0,1fr)]">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted sm:aspect-[3/4]">
                  {best.thumbnail_url ? <img src={best.thumbnail_url} alt={best.title || "Video"} className="h-full w-full object-cover" /> : <Play className="h-10 w-10 text-muted-foreground" aria-hidden />}
                </div>
                <div className="flex min-w-0 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-3 break-words text-lg font-semibold">{best.title || "Zonder titel"}</h3>
                    {best.url && <Button asChild variant="secondary" size="icon" className="shrink-0 bg-popover" title="Open post"><a href={best.url} target="_blank" rel="noopener noreferrer" aria-label="Open post"><ArrowUpRight aria-hidden /></a></Button>}
                  </div>
                  <div className="flex flex-wrap gap-2"><Tag className="">{NETWORK_LABELS[best.network as Network] ?? best.network}</Tag>
                    {best.published_at && <Tag className="">{new Date(best.published_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</Tag>}</div>
                  <p className="mt-auto text-4xl font-light leading-none tabular">{formatNumber(best.views)} <span className="text-sm text-muted-foreground">weergaven</span></p>
                </div>
              </article>
            </section>
          )}
        </>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Client-scoped stats (RLS limits daily_stats/videos to the own client): totals, chart, top videos. */
function ClientPerformanceTab() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { data, isLoading } = useClientStats(period);
  const stats = data?.stats ?? [];
  const range = data?.range;
  const { client } = useClient();
  if (client?.video_only || (!isLoading && (!data?.client || !stats.length))) return <StatsComing />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Jouw cijfers</h2>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>
      <KpiBand stats={stats} range={range!} loading={isLoading || !range} />
      {range && <DailyChart stats={stats} range={range} />}
      <TopVideoList videos={data?.videos ?? []} limit={5} />
      {range && <NetworkBreakdown stats={stats} range={range} />}
    </div>
  );
}
