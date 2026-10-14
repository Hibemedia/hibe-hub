import type { VideoRow } from "@/hooks/useClientStats";

export interface UpcomingMoment {
  id: string;
  title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  status: string;
}

export function selectBestVideo(videos: VideoRow[], start: string | null, end: string): VideoRow | null {
  return videos.filter((v) => {
    const date = v.published_at?.slice(0, 10);
    return date && (!start || date >= start) && date <= end && v.views != null;
  }).sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || a.id.localeCompare(b.id))[0] ?? null;
}

export function selectUpcomingMoments(moments: UpcomingMoment[], now: Date): UpcomingMoment[] {
  return moments.filter((m) => {
    if (!m.date || !["bevestigd", "gepland"].includes(m.status)) return false;
    // Undated times remain visible throughout their calendar day (Amsterdam).
    const time = m.start_time?.slice(0, 5) || "23:59";
    const localNow = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(now);
    return `${m.date} ${time}` >= localNow;
  }).sort((a, b) => `${a.date} ${a.start_time || "23:59"}`.localeCompare(`${b.date} ${b.start_time || "23:59"}`) || a.id.localeCompare(b.id)).slice(0, 3);
}