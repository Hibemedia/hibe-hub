import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Play } from "lucide-react";
import { PeriodSelect } from "@/components/PeriodSelect";
import { KpiBand, EmptyState } from "@/components/StatsOverview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientStats } from "@/hooks/useClientStats";
import { useOverviewVideo, useUpcomingMoments } from "@/hooks/useOverviewDetails";
import { usePendingReviewCount } from "@/hooks/useReviews";
import { NETWORK_LABELS, formatNumber, type Network, type PeriodKey } from "@/lib/stats";
import { useBase } from "@/lib/paths";

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const { data, isLoading, isError } = useClientStats(period);
  const stats = data?.stats ?? [];
  const range = data?.range;
  const base = useBase();
  const video = useOverviewVideo(range);
  const pending = usePendingReviewCount();
  const moments = useUpcomingMoments();
  const best = video.data;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="wordmark">Overzicht</h1>
          <Button asChild className="gap-3 pr-2" size="lg">
            <Link to={`${base}/performance`}>Bekijk Performance<span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><ArrowRight aria-hidden /></span></Link>
          </Button>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {isError ? (
        <EmptyState text="De cijfers konden niet worden geladen. Probeer het later opnieuw." />
      ) : !isLoading && !data?.client ? (
        <EmptyState text="Nog geen data. Je account is nog niet aan een klant gekoppeld." />
      ) : (
        <>
          {range ? <KpiBand stats={stats} range={range} loading={isLoading} /> : <Skeleton className="h-40 rounded-lg" />}
          <div className="grid items-start gap-5 lg:grid-cols-5">
            <section className="space-y-4 lg:col-span-3" aria-labelledby="best-video-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="best-video-title" className="text-2xl font-semibold">Uitgelichte video</h2>
                <Button asChild variant="ghost" size="sm"><Link to={`${base}/performance`}>Alle resultaten <ArrowRight aria-hidden /></Link></Button>
              </div>
              {video.isError ? <EmptyState text="De video kon niet worden geladen." />
                : isLoading || video.isLoading ? <Skeleton className="h-80 rounded-lg" />
                : !best ? <EmptyState text="Nog geen video's in deze periode." />
                : <article className="relative grid overflow-hidden rounded-lg bg-card sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted sm:aspect-[3/4]">
                    {best.thumbnail_url ? <img src={best.thumbnail_url} alt={best.title || "Video"} className="h-full w-full object-cover" /> : <Play className="h-12 w-12 text-muted-foreground" aria-hidden />}
                  </div>
                  <div className="flex min-w-0 flex-col gap-4 p-6">
                    <div className="flex min-h-9 items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Beste van deze periode</span>
                      {best.url && <Button asChild variant="secondary" size="icon" className="shrink-0 bg-popover" title="Open post"><a href={best.url} target="_blank" rel="noopener noreferrer" aria-label="Open post"><ArrowUpRight aria-hidden /></a></Button>}
                    </div>
                    <h3 className="line-clamp-4 break-words text-2xl font-semibold leading-snug">{best.title || "Zonder titel"}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="chip">{NETWORK_LABELS[best.network as Network] ?? best.network}</span>
                      {best.published_at && <span className="chip">{new Date(best.published_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </div>
                    <div className="mt-auto pt-3"><p className="text-[44px] font-light leading-none tabular">{formatNumber(best.views)}</p><p className="mt-2 text-sm text-muted-foreground">weergaven</p></div>
                  </div>
                </article>}
            </section>

            <div className="space-y-7 lg:col-span-2">
              <section className="space-y-4" aria-labelledby="pending-title">
                <h2 id="pending-title" className="text-2xl font-semibold">Te beoordelen</h2>
                {pending.isError ? <EmptyState text="De beoordelingen konden niet worden geladen." />
                  : pending.isLoading ? <Skeleton className="h-36 rounded-lg" />
                  : <div className="flex items-center justify-between gap-4 py-3">
                    <div><p className="text-[56px] font-light leading-none tabular">{pending.data ?? 0}</p><p className="mt-2 text-sm text-muted-foreground">{pending.data === 0 ? "Alles beoordeeld" : pending.data === 1 ? "Video wacht op jouw beoordeling" : "Video's wachten op jouw beoordeling"}</p></div>
                    <Button asChild size="icon" className="h-12 w-12 shrink-0" title="Bekijk Video Goedkeuring"><Link to={`${base}/video-approval`} aria-label="Bekijk Video Goedkeuring">{pending.data === 0 ? <Check aria-hidden /> : <ArrowRight aria-hidden />}</Link></Button>
                  </div>}
              </section>
              <section className="space-y-4" aria-labelledby="moments-title">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="moments-title" className="text-2xl font-semibold">Komende momenten</h2>
                  <Button asChild variant="ghost" size="sm"><Link to={`${base}/content-moments`}>Alles <ArrowRight aria-hidden /></Link></Button>
                </div>
                {moments.isError ? <EmptyState text="De contentmomenten konden niet worden geladen." />
                  : moments.isLoading ? <Skeleton className="h-40 rounded-lg" />
                  : !moments.data?.length ? <div className="space-y-3 py-3"><p className="text-sm text-muted-foreground">Nog geen komende bevestigde of geplande momenten.</p><Button asChild variant="outline" size="sm"><Link to={`${base}/content-moments`}>Bekijk Contentmomenten <ArrowRight aria-hidden /></Link></Button></div>
                  : <ul className="space-y-3">{moments.data.map((m) => <li key={m.id} className="rounded-lg bg-card">
                    <Button asChild variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-lg p-4 text-left">
                      <Link to={`${base}/content-moments`}>
                        <CalendarDays className="mr-2 shrink-0 text-muted-foreground" aria-hidden />
                        <div className="min-w-0 flex-1"><p className="break-words text-base font-semibold">{m.title}</p><p className="mt-1 text-xs font-normal text-muted-foreground">{m.date && new Date(`${m.date}T00:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}{m.start_time && ` · ${m.start_time.slice(0, 5)}`}</p><span className="mt-2 inline-block chip">{m.status === "bevestigd" ? "Bevestigd" : "Gepland"}</span></div>
                        <ArrowRight className="shrink-0" aria-hidden />
                      </Link>
                    </Button>
                  </li>)}</ul>}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
