export interface MedalVideo { id: string; title: string | null; views: number | null; published_at: string | null; network: string; url?: string | null; thumbnail_url?: string | null }
export interface MedalStat { network: string; date: string; followers: number | null; views: number | null; posts: number | null }

export const LEVELS = {
  biggestVideo: [10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000],
  totalFollowers: [1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000],
  totalViews: [100_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000],
  videosOver10k: [1, 5, 10, 25, 50, 100],
  streakWeeks: [4, 8, 12, 26, 52],
};

export interface Medal {
  key: keyof typeof LEVELS;
  value: number;
  levelIndex: number; // -1 = nothing reached yet
  reached: number | null;
  next: number | null;
  progress: number; // 0..100 towards next (100 when maxed)
  achievedDate: string | null;
  achievedVideo: MedalVideo | null;
  extra?: { longest: number };
}

function build(key: keyof typeof LEVELS, value: number, achieved: (level: number) => { date: string | null; video?: MedalVideo | null }): Medal {
  const lv = LEVELS[key];
  let idx = -1;
  lv.forEach((l, i) => { if (value >= l) idx = i; });
  const reached = idx >= 0 ? lv[idx] : null;
  const next = idx + 1 < lv.length ? lv[idx + 1] : null;
  const base = reached ?? 0;
  const progress = next == null ? 100 : Math.max(0, Math.min(100, ((value - base) / (next - base)) * 100));
  const a = reached != null ? achieved(reached) : { date: null, video: null };
  return { key, value, levelIndex: idx, reached, next, progress, achievedDate: a.date, achievedVideo: a.video ?? null };
}

const day = (d: string | null) => (d ? d.slice(0, 10) : null);

/** Monday (UTC) of the week a date falls in, as YYYY-MM-DD. */
export function weekStart(d: string): string {
  const t = new Date(d.slice(0, 10) + "T00:00:00Z");
  const dow = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dow);
  return t.toISOString().slice(0, 10);
}

export function postStreak(postDates: string[], today = new Date()) {
  const weeks = new Set(postDates.map(weekStart));
  if (!weeks.size) return { current: 0, longest: 0 };
  const sorted = [...weeks].sort();
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const gap = (Date.parse(sorted[i]) - Date.parse(sorted[i - 1])) / 864e5;
    run = gap === 7 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  // Current: count back from this week; an empty current week doesn't break the streak yet.
  let w = new Date(weekStart(today.toISOString()) + "T00:00:00Z");
  if (!weeks.has(w.toISOString().slice(0, 10))) w.setUTCDate(w.getUTCDate() - 7);
  let current = 0;
  while (weeks.has(w.toISOString().slice(0, 10))) { current++; w.setUTCDate(w.getUTCDate() - 7); }
  return { current, longest };
}

export function computeMedals(videos: MedalVideo[], stats: MedalStat[], today = new Date()): Medal[] {
  const byViews = [...videos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  const byDate = [...videos].filter((v) => v.published_at).sort((a, b) => a.published_at!.localeCompare(b.published_at!));

  // (a) biggest video: first video (by date) that crossed the level
  const top = byViews[0];
  const biggest = build("biggestVideo", top?.views ?? 0, (l) => {
    const v = byDate.find((x) => (x.views ?? 0) >= l) ?? top;
    return { date: day(v?.published_at ?? null), video: v };
  });

  // (b) total followers over all channels (carry each channel's last known value forward)
  const dates = [...new Set(stats.map((s) => s.date))].sort();
  const byDateStats = new Map<string, MedalStat[]>();
  for (const s of stats) (byDateStats.get(s.date) ?? byDateStats.set(s.date, []).get(s.date)!).push(s);
  const last: Record<string, number> = {};
  const followerSeries: { date: string; total: number }[] = [];
  let cumViews = 0;
  const viewSeries: { date: string; total: number }[] = [];
  for (const d of dates) {
    for (const s of byDateStats.get(d)!) {
      if (s.followers != null) last[s.network] = s.followers;
      cumViews += s.views ?? 0;
    }
    followerSeries.push({ date: d, total: Object.values(last).reduce((a, b) => a + b, 0) });
    viewSeries.push({ date: d, total: cumViews });
  }
  const firstCross = (series: { date: string; total: number }[], l: number) => series.find((x) => x.total >= l)?.date ?? null;
  const followers = build("totalFollowers", followerSeries.at(-1)?.total ?? 0, (l) => ({ date: firstCross(followerSeries, l) }));
  const views = build("totalViews", cumViews, (l) => ({ date: firstCross(viewSeries, l) }));

  // (d) number of videos over 10K
  const over = byDate.filter((v) => (v.views ?? 0) > 10_000);
  const over10k = build("videosOver10k", videos.filter((v) => (v.views ?? 0) > 10_000).length, (l) => {
    const v = over[l - 1] ?? null;
    return { date: day(v?.published_at ?? null), video: v };
  });

  // (e) weekly post streak (video publish dates + days with posts in daily stats)
  const postDates = [...byDate.map((v) => v.published_at!), ...stats.filter((s) => (s.posts ?? 0) > 0).map((s) => s.date)];
  const streak = postStreak(postDates, today);
  const streakMedal = build("streakWeeks", streak.current, () => ({ date: null }));
  streakMedal.extra = { longest: streak.longest };

  return [biggest, followers, views, over10k, streakMedal];
}
