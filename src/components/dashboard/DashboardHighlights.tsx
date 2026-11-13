import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls } from "@/hooks/useLogoUrl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { nextContentMoment, type HighlightMoment } from "@/lib/dashboard-highlights";
import vipMomentPhoto from "@/assets/vip-fashion-contentmoment.jpg.asset.json";
import appelboomMomentPhoto from "@/assets/appelboom-contentmoment.jpg.asset.json";

const MOMENT_BACKDROPS: Record<string, string> = { "VIP Fashion": vipMomentPhoto.url, Appelboom: appelboomMomentPhoto.url };

type ReviewItem = { id: string; title: string; client_id: string };

function ClientImage({ url, className }: { url?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? <img src={url} alt="" className={className} onError={() => setFailed(true)} /> : null;
}

export function DashboardHighlights() {
  const { clients } = useClient();
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const { data: review, isLoading: reviewLoading, isError: reviewError } = useQuery({
    queryKey: ["dashboard", "next-internal-review"],
    queryFn: async () => {
      const { data, count, error } = await supabase.from("video_items").select("id,title,client_id", { count: "exact" })
        .eq("status", "internal_review").is("archived_at", null)
        .order("status_changed_at", { ascending: true }).order("id").limit(3);
      if (error) throw error;
      return { items: (data ?? []) as ReviewItem[], total: count ?? 0 };
    },
  });
  const { data: moments = [], isLoading: momentLoading, isError: momentError } = useQuery({
    queryKey: ["content-moments", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_moments").select("*").order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as HighlightMoment[];
    },
  });
  const moment = nextContentMoment(moments);
  const momentClient = clients.find((c) => c.id === moment?.client_id);
  const momentLogo = momentClient?.logo_url ? logos[momentClient.logo_url] : undefined;
  const momentBackdrop = (momentClient && MOMENT_BACKDROPS[momentClient.name]) || momentLogo;
  const dateLabel = moment?.date ? new Date(`${moment.date}T00:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }) : "";
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  const clientLogo = (id: string) => { const c = clients.find((x) => x.id === id); return c?.logo_url ? logos[c.logo_url] : undefined; };

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-12" aria-label="Eerstvolgende werkzaamheden">
      <section className="flex min-w-0 flex-col rounded-lg bg-card p-5 md:p-6 lg:col-span-7" aria-label="Te beoordelen door HIBE">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <h2 className="truncate text-sm font-medium text-muted-foreground" title="Te beoordelen door HIBE">Te beoordelen door HIBE</h2>
          {review && review.total > 0 && <span className="shrink-0 rounded-full bg-popover px-2.5 py-0.5 text-xs font-semibold">{review.total} open</span>}
        </div>
        {reviewLoading ? <Skeleton className="mt-4 h-24 w-full" /> : review && review.items.length ? (
          <ul className="mt-2 divide-y divide-border">
            {review.items.map((item) => (
              <li key={item.id}>
                <Link to={`/hibe/videos/${item.id}`} className="group flex min-w-0 items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-popover">
                    <ClientImage key={clientLogo(item.client_id)} url={clientLogo(item.client_id)} className="h-full w-full object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{clientName(item.client_id)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="my-auto py-5 text-sm text-muted-foreground">{reviewError ? "Beoordelingen konden niet worden geladen." : "Niets te beoordelen."}</p>}
        {review && review.total > review.items.length && (
          <Button asChild variant="link" size="sm" className="mt-1 self-start px-0 text-muted-foreground">
            <Link to="/hibe/videos/stap/interne-controle">Alle {review.total} bekijken<ArrowUpRight aria-hidden /></Link>
          </Button>
        )}
      </section>
      <section className="relative isolate flex min-h-60 min-w-0 flex-col items-start overflow-hidden rounded-lg bg-foreground p-5 text-background md:p-6 lg:col-span-5" aria-label="Eerstvolgende contentmoment">
        <CalendarDays className="absolute bottom-5 right-5 -z-10 h-28 w-28 text-background/10" aria-hidden />
        <ClientImage key={momentBackdrop} url={momentBackdrop} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-foreground/80" />
        <h2 className="w-full truncate text-sm font-medium text-background/80" title="Eerstvolgende contentmoment">Eerstvolgende contentmoment</h2>
        {momentLoading ? <Skeleton className="mt-4 h-20 w-full bg-background/15" /> : moment ? <>
          <p className="mt-3 line-clamp-2 w-full break-words text-xl font-semibold">{momentClient?.name ?? "Klant"}</p>
          <p className="mt-1 line-clamp-2 w-full break-words text-sm text-background/80">{moment.title}</p>
          <p className="mt-2 text-sm text-background/80">{dateLabel}{moment.start_time ? ` · ${moment.start_time.slice(0, 5)}` : ""}</p>
          <Button asChild size="sm" variant="secondary" className="mt-auto bg-background text-foreground hover:bg-background/90"><Link to="/hibe/agenda">Open agenda<ArrowUpRight aria-hidden /></Link></Button>
        </> : <p className="my-auto py-5 text-sm text-background/80">{momentError ? "Contentmomenten konden niet worden geladen." : "Geen contentmomenten gepland."}</p>}
      </section>
    </div>
  );
}
