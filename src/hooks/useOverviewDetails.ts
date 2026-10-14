import { useQuery } from "@tanstack/react-query";
import { useClient } from "@/context/ClientContext";
import { supabase } from "@/integrations/supabase/client";
import type { VideoRow } from "@/hooks/useClientStats";
import { selectBestVideo, selectUpcomingMoments, type UpcomingMoment } from "@/lib/overview";

type Range = { start: string | null; end: string };

export function useOverviewVideo(range: Range | undefined) {
  const { clientId, ready } = useClient();
  return useQuery({
    queryKey: ["overview-video", clientId, range?.start, range?.end],
    enabled: ready && !!clientId && !!range,
    queryFn: async () => {
      if (!clientId || !range) return null;
      let q = supabase.from("videos")
        .select("id,network,external_id,published_at,title,views,likes,comments,shares,saves,url,thumbnail_url")
        .eq("client_id", clientId).lte("published_at", `${range.end}T23:59:59.999Z`)
        .not("views", "is", null).order("views", { ascending: false }).order("id").limit(1);
      if (range.start) q = q.gte("published_at", range.start);
      const { data, error } = await q;
      if (error) throw error;
      const best = selectBestVideo((data ?? []) as VideoRow[], range.start, range.end);
      if (best?.thumbnail_url?.startsWith("storage:thumbnails/")) {
        const { data: signed, error: signError } = await supabase.storage.from("thumbnails")
          .createSignedUrl(best.thumbnail_url.slice("storage:thumbnails/".length), 3600);
        if (signError) throw signError;
        best.thumbnail_url = signed?.signedUrl ?? null;
      }
      return best;
    },
  });
}

export function useUpcomingMoments() {
  const { clientId, ready } = useClient();
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
  return useQuery({
    queryKey: ["content-moments", clientId, "overview", today],
    enabled: ready && !!clientId,
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase.from("content_moments")
        .select("id,title,date,start_time,location,status").eq("client_id", clientId)
        .in("status", ["bevestigd", "gepland"]).gte("date", today)
        .order("date").order("start_time", { nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as UpcomingMoment[];
    },
    select: (moments) => selectUpcomingMoments(moments, new Date()),
  });
}