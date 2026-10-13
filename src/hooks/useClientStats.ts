import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyStat, PeriodKey, periodRange } from "@/lib/stats";

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
}

export function useClientStats(period: PeriodKey) {
  return useQuery({
    queryKey: ["client-stats", period],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Niet ingelogd");
      const { data: me } = await supabase.from("users").select("client_id").eq("id", auth.user.id).maybeSingle();
      const clientId = me?.client_id ?? null;
      if (!clientId) return { client: null, stats: [] as DailyStat[], videos: [] as VideoRow[], range: periodRange(period) };

      const range = periodRange(period);
      const { data: client } = await supabase.from("clients").select("id,name").eq("id", clientId).maybeSingle();

      // All rows up to period end: needed for "last followers before period".
      const { data: stats, error } = await supabase
        .from("daily_stats")
        .select("network,date,followers,views,interactions,posts,reach")
        .eq("client_id", clientId)
        .lte("date", range.end)
        .order("date", { ascending: true })
        .limit(10000);
      if (error) throw error;

      let vq = supabase
        .from("videos")
        .select("id,network,external_id,published_at,title,views,likes,comments,shares,saves")
        .eq("client_id", clientId)
        .order("views", { ascending: false })
        .limit(10);
      if (range.start) vq = vq.gte("published_at", range.start);
      const { data: videos, error: vErr } = await vq;
      if (vErr) throw vErr;

      return { client, stats: (stats ?? []) as DailyStat[], videos: (videos ?? []) as VideoRow[], range };
    },
  });
}
