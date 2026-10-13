import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyStat, PeriodKey, periodRange } from "@/lib/stats";
import { useClient } from "@/context/ClientContext";

export interface VideoRow {
  id: string;
  network: string;
  external_id: string;
  published_at: string | null;
  title: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  url: string | null;
  thumbnail_url: string | null;
}

const PAGE = 1000; // Data API caps selects at 1000 rows — paginate.

export function useClientStats(period: PeriodKey) {
  const { clientId, client, ready } = useClient();
  return useQuery({
    queryKey: ["client-stats", period, clientId],
    enabled: ready,
    queryFn: async () => {
      if (!clientId) return { client: null, stats: [] as DailyStat[], videos: [] as VideoRow[], range: periodRange(period) };

      // Period ends on the last date that has real data (usually yesterday), not today.
      const { data: last } = await supabase
        .from("daily_stats")
        .select("date")
        .eq("client_id", clientId)
        .or("followers.not.is.null,views.not.is.null")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      const range = periodRange(period, last?.date ? new Date(last.date + "T00:00:00Z") : new Date());

      const stats: DailyStat[] = [];
      for (let from = 0; ; from += PAGE) {
        let q = supabase
          .from("daily_stats")
          .select("network,date,followers,views,interactions,posts,reach")
          .eq("client_id", clientId)
          .lte("date", range.end)
          .order("date", { ascending: true })
          .range(from, from + PAGE - 1);
        if (range.prevStart) q = q.gte("date", range.prevStart);
        const { data, error } = await q;
        if (error) throw error;
        stats.push(...((data ?? []) as DailyStat[]));
        if (!data || data.length < PAGE) break;
      }

      let vq = supabase
        .from("videos")
        .select("id,network,external_id,published_at,title,views,likes,comments,shares,saves,url,thumbnail_url")
        .eq("client_id", clientId)
        .order("views", { ascending: false })
        .limit(10);
      if (range.start) vq = vq.gte("published_at", range.start);
      const { data: videos, error: vErr } = await vq;
      if (vErr) throw vErr;

      return { client: client ? { id: client.id, name: client.name } : null, stats, videos: (videos ?? []) as VideoRow[], range };
    },
  });
}
