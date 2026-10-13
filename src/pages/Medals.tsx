import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { computeMedals, Medal, MedalStat, MedalVideo } from "@/lib/medals";
import { formatNumber, NETWORK_LABELS, Network } from "@/lib/stats";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/StatsOverview";

const PAGE = 1000;
async function fetchAll<T>(table: "videos" | "daily_stats", cols: string, clientId: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(cols).eq("client_id", clientId).range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const META: Record<Medal["key"], { title: string; unit: (n: number) => string; desc: string }> = {
  biggestVideo: { title: "Grootste video", unit: (n) => `${formatNumber(n)} weergaven`, desc: "Weergaven van je best bekeken video ooit" },
  totalFollowers: { title: "Volgers", unit: (n) => `${formatNumber(n)} volgers`, desc: "Totaal over alle kanalen" },
  totalViews: { title: "Totale weergaven", unit: (n) => `${formatNumber(n)} weergaven`, desc: "Alle weergaven sinds de start" },
  videosOver10k: { title: "Video's boven 10K", unit: (n) => `${formatNumber(n)} video's`, desc: "Aantal video's met meer dan 10.000 weergaven" },
  streakWeeks: { title: "Post-streak", unit: (n) => `${n} weken`, desc: "Weken op rij met minstens één post" },
};
const fmtDate = (d: string | null) => (d ? new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : null);

export default function Medals() {
  const { clientId, ready } = useClient();
  const { data, isLoading } = useQuery({
    queryKey: ["medals", clientId],
    enabled: ready && !!clientId,
    queryFn: async () => {
      const [videos, stats] = await Promise.all([
        fetchAll<MedalVideo>("videos", "id,network,title,views,published_at,url,thumbnail_url", clientId!),
        fetchAll<MedalStat>("daily_stats", "network,date,followers,views,posts", clientId!),
      ]);
      const hall = [...videos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5).map((v) => ({ ...v }));
      const stored = hall.filter((v) => v.thumbnail_url?.startsWith("storage:thumbnails/"));
      if (stored.length) {
        const { data: signed } = await supabase.storage.from("thumbnails").createSignedUrls(stored.map((v) => v.thumbnail_url!.slice(19)), 3600);
        stored.forEach((v, i) => { v.thumbnail_url = signed?.[i]?.signedUrl ?? null; });
      }
      return { medals: computeMedals(videos, stats), hall, empty: !videos.length && !stats.length };
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <h1 className="wordmark">Medailles</h1>
      {!clientId && ready ? <section className="rounded-lg bg-card"><EmptyState text="Je account is nog niet aan een klant gekoppeld." /></section>
        : isLoading || !data ? <Skeleton className="h-64 rounded-lg" />
        : data.empty ? <section className="rounded-lg bg-card"><EmptyState text="Nog geen data om medailles uit te berekenen." /></section>
        : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.medals.map((m) => <MedalCard key={m.key} m={m} />)}
          </ul>
          <section className="rounded-lg bg-card p-5 md:p-7">
            <h2 className="mb-5 text-xl font-semibold tracking-tight md:text-2xl">Hall of fame</h2>
            <ol className="space-y-2">
              {data.hall.map((v, i) => (
                <li key={v.id} className="relative flex items-center gap-4 rounded-lg bg-popover p-3 pr-16">
                  <span className="w-8 shrink-0 text-center text-3xl font-light tabular">{i + 1}</span>
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-[12px] bg-muted">
                    {v.thumbnail_url && <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{v.title || "Zonder titel"}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="chip">{NETWORK_LABELS[v.network as Network] ?? v.network}</span>
                      {v.published_at && <span className="chip">{fmtDate(v.published_at)}</span>}
                    </div>
                  </div>
                  <div className="hidden text-right tabular sm:block"><span className="text-2xl font-light">{formatNumber(v.views)}</span> <span className="text-xs text-muted-foreground">weergaven</span></div>
                  {v.url && <a href={v.url} target="_blank" rel="noopener noreferrer" aria-label="Open post" className="round-btn absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 bg-card"><span aria-hidden>↗</span></a>}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

function MedalCard({ m }: { m: Medal }) {
  const meta = META[m.key];
  return (
    <li className="flex flex-col rounded-lg bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{meta.title}</h2>
          <p className="text-sm text-muted-foreground">{meta.desc}</p>
        </div>
        {m.levelIndex >= 0
          ? <span className="growth shrink-0">Niveau {m.levelIndex + 1}</span>
          : <span className="chip shrink-0">Nog geen niveau</span>}
      </div>
      <div className="mt-5 text-[44px] font-light leading-none tracking-tight tabular">{formatNumber(m.value)}</div>
      <p className="mt-1 text-sm text-muted-foreground">{m.reached != null ? `Behaald: ${meta.unit(m.reached)}` : "Eerste niveau nog niet behaald"}</p>
      <div className="mt-5">
        <Progress value={m.progress} aria-label={`Voortgang ${meta.title}`} />
        <p className="mt-2 text-xs text-muted-foreground">{m.next != null ? `Volgende: ${meta.unit(m.next)}` : "Hoogste niveau behaald"}</p>
      </div>
      <div className="mt-4 border-t border-border/70 pt-3 text-sm">
        {m.key === "streakWeeks" ? (
          <span>Langste reeks: <span className="font-semibold">{m.extra?.longest ?? 0} weken</span></span>
        ) : m.achievedVideo ? (
          <span className="line-clamp-2">Behaald met "{m.achievedVideo.title || "zonder titel"}"{m.achievedDate && <span className="text-muted-foreground"> · {fmtDate(m.achievedDate)}</span>}</span>
        ) : m.achievedDate ? (
          <span>Behaald op {fmtDate(m.achievedDate)}</span>
        ) : <span className="text-muted-foreground">Nog niet behaald</span>}
      </div>
    </li>
  );
}
