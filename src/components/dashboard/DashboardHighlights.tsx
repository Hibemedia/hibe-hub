import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls } from "@/hooks/useLogoUrl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ReviewHighlight = { id: string; title: string; client_id: string };

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
      const { data, error } = await supabase.from("video_items").select("id,title,client_id")
        .eq("status", "internal_review").is("archived_at", null)
        .order("status_changed_at", { ascending: true }).order("id").limit(1).maybeSingle();
      if (error) throw error;
      return data as ReviewHighlight | null;
    },
  });
  const reviewClient = clients.find((c) => c.id === review?.client_id);
  const reviewLogo = reviewClient?.logo_url ? logos[reviewClient.logo_url] : undefined;

  return (
    <section className="grid min-h-60 min-w-0 grid-cols-[minmax(0,1fr)_minmax(80px,34%)] gap-4 rounded-lg bg-card p-5 md:gap-6 md:p-6" aria-label="Eerstvolgende te beoordelen">
      <div className="flex min-w-0 flex-col items-start">
        <h2 className="w-full truncate text-sm font-medium text-muted-foreground" title="Eerstvolgende te beoordelen">Eerstvolgende te beoordelen</h2>
        {reviewLoading ? <Skeleton className="mt-4 h-20 w-full" /> : review ? <>
          <p className="mt-3 line-clamp-3 w-full break-words text-xl font-semibold">{review.title}</p>
          <p className="mt-2 w-full truncate text-sm text-muted-foreground">{reviewClient?.name ?? "Klant"}</p>
          <Button asChild size="sm" className="mt-auto bg-foreground text-background hover:bg-foreground/85"><Link to={`/hibe/videos/${review.id}`}>Bekijk edit<ArrowUpRight aria-hidden /></Link></Button>
        </> : <p className="my-auto py-5 text-sm text-muted-foreground">{reviewError ? "Beoordelingen konden niet worden geladen." : "Niets te beoordelen."}</p>}
      </div>
      <div className="relative flex min-w-0 items-center justify-center overflow-hidden rounded-lg bg-popover">
        <Film className="absolute h-10 w-10 text-muted-foreground/40" aria-hidden />
        <ClientImage key={reviewLogo} url={reviewLogo} className="relative h-full max-h-56 w-full bg-popover object-contain p-3" />
      </div>
    </section>
  );
}
