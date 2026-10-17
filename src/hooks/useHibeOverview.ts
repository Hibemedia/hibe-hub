import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyStat, PeriodKey, periodRange, totalsFor, pctChange } from "@/lib/stats";
import type { VideoRow } from "@/hooks/useClientStats";

const PAGE = 1000;
const AM = "Europe/Amsterdam";
export type ClientStat = DailyStat & { client_id: string };
export type TopVideo = VideoRow & { client_id: string };

/** UTC offset (ms) of a time zone at a given instant (DST-aware). */
function tzOffsetMs(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const g = (t: string) => Number(f.formatToParts(date).find((p) => p.type === t)!.value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second")) - date.getTime();
}

/** UTC instant of 00:00 Amsterdam time on a YYYY-MM-DD date. */
function amMidnight(dateStr: string) {
  const asUTC = Date.parse(`${dateStr}T00:00:00Z`);
  return asUTC - tzOffsetMs(new Date(asUTC + 12 * 3600e3), AM);
}

/** Monday 00:00 through Sunday 24:00 of the previous ISO week, Amsterdam time, as ISO strings. */
export function lastWeekRange(now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: AM, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = new Date(Date.parse(`${today}T00:00:00Z`) - dow * 86400e3).toISOString().slice(0, 10);
  const lastMonday = new Date(Date.parse(`${monday}T00:00:00Z`) - 7 * 86400e3).toISOString().slice(0, 10);
  return { start: new Date(amMidnight(lastMonday)).toISOString(), end: new Date(amMidnight(monday)).toISOString() };
}

export interface ClientSummary {
  clientId: string;
  views: number;
  prevViews: number | null;
  viewsChange: number | null;
  followers: number | null;
  followersGrowth: number | null;
  posts: number;
  hasData: boolean;
}

/** Cross-client figures for the HIBE environment (admins can read every client's rows). */
export function useHibeOverview(period: PeriodKey, enabled = true) {
  return useQuery({
    queryKey: ["hibe-overview", period],
    enabled,
    queryFn: async () => {
      const { data: last } = await supabase.from("daily_stats").select("date").or("followers.not.is.null,views.not.is.null")
        .order("date", { ascending: false }).limit(1).maybeSingle();
      const range = periodRange(period, last?.date ? new Date(last.date + "T00:00:00Z") : new Date());
      const stats: ClientStat[] = [];
      for (let from = 0; ; from += PAGE) {
        let q = supabase.from("daily_stats").select("client_id,network,date,followers,views,interactions,posts")
          .lte("date", range.end).order("date").order("id").range(from, from + PAGE - 1);
        if (range.prevStart) q = q.gte("date", range.prevStart);
        const { data, error } = await q;
        if (error) throw error;
        stats.push(...((data ?? []) as ClientStat[]));
        if (!data || data.length < PAGE) break;
      }

      const byClient = new Map<string, ClientStat[]>();
      for (const r of stats) (byClient.get(r.client_id) ?? byClient.set(r.client_id, []).get(r.client_id)!).push(r);
      const summaries: ClientSummary[] = [...byClient.entries()].map(([clientId, rows]) => {
        const cur = totalsFor(rows, range.start, range.end);
        const prev = range.prevStart ? totalsFor(rows, range.prevStart, range.prevEnd) : null;
        return {
          clientId, views: cur.views, prevViews: prev?.hasData ? prev.views : null,
          viewsChange: prev?.hasData ? pctChange(cur.views, prev.views) : null,
          followers: cur.followers, followersGrowth: cur.followersGrowth, posts: cur.posts, hasData: cur.hasData,
        };
      });
      const sum = (f: (s: ClientSummary) => number | null) => summaries.reduce((a, s) => a + (f(s) ?? 0), 0);
      const prevTotals = range.prevStart ? (() => {
        const p = [...byClient.values()].map((rows) => totalsFor(rows, range.prevStart, range.prevEnd));
        return { views: p.reduce((a, t) => a + t.views, 0), posts: p.reduce((a, t) => a + t.posts, 0), growth: p.reduce((a, t) => a + (t.followersGrowth ?? 0), 0) };
      })() : null;
      const totals = {
        views: sum((s) => s.views), followers: sum((s) => s.followers), newFollowers: sum((s) => s.followersGrowth), posts: sum((s) => s.posts),
        viewsChange: prevTotals ? pctChange(sum((s) => s.views), prevTotals.views) : null,
        postsChange: prevTotals ? pctChange(sum((s) => s.posts), prevTotals.posts) : null,
      };

      let vq = supabase.from("videos").select("id,client_id,network,external_id,published_at,title,views,likes,comments,shares,saves,url,thumbnail_url")
        .order("views", { ascending: false }).limit(5);
      if (range.start) vq = vq.gte("published_at", range.start);
      const { data: vids } = await vq;
      const videos = (vids ?? []) as TopVideo[];
      const stored = videos.filter((v) => v.thumbnail_url?.startsWith("storage:thumbnails/"));
      if (stored.length) {
        const { data: signed } = await supabase.storage.from("thumbnails").createSignedUrls(stored.map((v) => v.thumbnail_url!.slice(19)), 3600);
        stored.forEach((v, i) => { v.thumbnail_url = signed?.[i]?.signedUrl ?? null; });
      }
      return { range, stats, summaries, totals, videos };
    },
  });
}

/** Top 5 videos published last week (Mon–Sun, Amsterdam), across all clients. */
export function useTopVideosLastWeek(enabled = true) {
  return useQuery({
    queryKey: ["hibe-top-videos-last-week"],
    enabled,
    queryFn: async (): Promise<TopVideo[]> => {
      const { start, end } = lastWeekRange();
      const vq = supabase.from("videos").select("id,client_id,network,external_id,published_at,title,views,likes,comments,shares,saves,url,thumbnail_url")
        .gte("published_at", start).lt("published_at", end).order("views", { ascending: false }).limit(5);
      const { data: vids, error } = await vq;
      if (error) throw error;
      const videos = (vids ?? []) as TopVideo[];
      const stored = videos.filter((v) => v.thumbnail_url?.startsWith("storage:thumbnails/"));
      if (stored.length) {
        const { data: signed } = await supabase.storage.from("thumbnails").createSignedUrls(stored.map((v) => v.thumbnail_url!.slice(19)), 3600);
        stored.forEach((v, i) => { v.thumbnail_url = signed?.[i]?.signedUrl ?? null; });
      }
      return videos;
    },
  });
}

export interface ActionData {
  pending: Record<string, number>;
  changes: { id: string; client_id: string; title: string }[];
  requested: { id: string; client_id: string; title: string; date: string | null }[];
  syncIssues: { client_id: string; status: string; finished_at: string | null; started_at: string; error: string | null; reason: "failed" | "stale" | "never" }[];
}

export function useHibeActions(clientIds: string[]) {
  return useQuery({
    queryKey: ["hibe-actions", clientIds.join(",")],
    enabled: clientIds.length > 0,
    queryFn: async (): Promise<ActionData> => {
      const [{ data: items }, { data: moments }, { data: runs }] = await Promise.all([
        supabase.from("review_items").select("id,client_id,title,status").in("status", ["pending", "changes_requested"]),
        supabase.from("content_moments").select("id,client_id,title,date").eq("status", "aangevraagd").order("created_at"),
        supabase.from("sync_runs").select("client_id,status,started_at,finished_at,error").order("started_at", { ascending: false }).limit(1000),
      ]);
      const pending: Record<string, number> = {};
      for (const i of items ?? []) if (i.status === "pending") pending[i.client_id] = (pending[i.client_id] ?? 0) + 1;
      const latest = new Map<string, NonNullable<typeof runs>[number]>();
      for (const r of runs ?? []) if (!latest.has(r.client_id)) latest.set(r.client_id, r);
      const cutoff = Date.now() - 48 * 3600e3;
      const syncIssues: ActionData["syncIssues"] = [];
      for (const id of clientIds) {
        const r = latest.get(id);
        if (!r) { syncIssues.push({ client_id: id, status: "none", finished_at: null, started_at: "", error: null, reason: "never" }); continue; }
        const lastOk = r.finished_at ?? r.started_at;
        if (r.status === "fout" || r.status === "error") syncIssues.push({ ...r, reason: "failed" });
        else if (Date.parse(lastOk) < cutoff) syncIssues.push({ ...r, reason: "stale" });
      }
      return {
        pending,
        changes: (items ?? []).filter((i) => i.status === "changes_requested"),
        requested: moments ?? [],
        syncIssues,
      };
    },
  });
}
