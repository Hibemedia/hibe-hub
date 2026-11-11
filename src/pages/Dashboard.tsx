import { PageHeader } from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, Play } from "lucide-react";
import { KpiBand, EmptyState } from "@/components/StatsOverview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientStats } from "@/hooks/useClientStats";
import { useOverviewVideo } from "@/hooks/useOverviewDetails";
import { usePendingReviewCount } from "@/hooks/useReviews";
import { NETWORK_LABELS, formatNumber, type Network, type PeriodKey } from "@/lib/stats";
import { useBase } from "@/lib/paths";

export default function Dashboard() {
  const { data, isLoading, isError } = useClientStats("30d" as PeriodKey);
  const stats = data?.stats ?? [];
  const range = data?.range;
  const base = useBase();
  const video = useOverviewVideo(range);
  const pending = usePendingReviewCount();
  const n = pending.data ?? 0;
  const best = video.data;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <PageHeader title="Home" />
      <section className="flex flex-col gap-4 rounded-lg bg-foreground p-5 text-background sm:flex-row sm:items-center sm:justify-between md:p-6" aria-live="polite">
        <div>
          <p className="text-2xl font-semibold">{pending.isLoading ? "…" : n === 0 ? "Er wacht niets op jouw beoordeling" : `${n} video${n === 1 ? "" : "'s"} wacht${n === 1 ? "" : "en"} op jouw beoordeling`}</p>
          <p className="mt-1 text-sm text-background/70">{n === 0 ? "Zodra HIBE nieuwe video's klaarzet, verschijnen ze hier." : "Bekijk ze en keur goed of vraag een wijziging."}</p>
        </div>
        <Button asChild className="shrink-0 bg-lime text-lime-foreground hover:bg-lime/90"><Link to={n ? `${base}/videos/beoordelen` : `${base}/videos`}>{n ? <><Play aria-hidden />Start beoordelen</> : <><Check aria-hidden />Bekijk video's</>}</Link></Button>
      </section>

      {isError ? (
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
                  <div className="flex flex-wrap gap-2"><span className="chip">{NETWORK_LABELS[best.network as Network] ?? best.network}</span>
                    {best.published_at && <span className="chip">{new Date(best.published_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</span>}</div>
                  <p className="mt-auto text-4xl font-light leading-none tabular">{formatNumber(best.views)} <span className="text-sm text-muted-foreground">weergaven</span></p>
                </div>
              </article>
            </section>
          )}
        </>
      )}
    </div>
  );
}
