export type Network = "ig" | "tt" | "yt" | "fb" | "li" | "th";
export type PeriodKey = "7d" | "30d" | "90d" | "12m" | "all";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "7 dagen" },
  { key: "30d", label: "30 dagen" },
  { key: "90d", label: "90 dagen" },
  { key: "12m", label: "12 maanden" },
  { key: "all", label: "Alles" },
];

export const NETWORK_LABELS: Record<Network, string> = {
  ig: "Instagram",
  tt: "TikTok",
  yt: "YouTube",
  fb: "Facebook",
  li: "LinkedIn",
  th: "Threads",
};

export interface DailyStat {
  network: string;
  date: string; // YYYY-MM-DD
  followers: number | null;
  views: number | null;
  interactions: number | null;
  posts: number | null;
  reach?: number | null;
}

const toISO = (d: Date) => d.toISOString().slice(0, 10);

/** Returns inclusive [start, end] and previous period range (null for "all"). */
export function periodRange(period: PeriodKey, today = new Date()) {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (period === "all") return { start: null as string | null, end: toISO(end), prevStart: null as string | null, prevEnd: null as string | null };
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const start = new Date(end); start.setUTCDate(end.getUTCDate() - days + 1);
  const prevEnd = new Date(start); prevEnd.setUTCDate(start.getUTCDate() - 1);
  const prevStart = new Date(prevEnd); prevStart.setUTCDate(prevEnd.getUTCDate() - days + 1);
  return { start: toISO(start), end: toISO(end), prevStart: toISO(prevStart), prevEnd: toISO(prevEnd) };
}

const inRange = (d: string, s: string | null, e: string | null) => (!s || d >= s) && (!e || d <= e);

function lastFollowers(rows: DailyStat[], network: string, s: string | null, e: string | null): number | null {
  let best: DailyStat | null = null;
  for (const r of rows) {
    if (r.network !== network || r.followers == null || !inRange(r.date, s, e)) continue;
    if (!best || r.date > best.date) best = r;
  }
  return best ? best.followers : null;
}

export interface PeriodTotals {
  followers: number | null;
  followersGrowth: number | null;
  views: number;
  interactions: number;
  posts: number;
  hasData: boolean;
}

/** Totals for a window. Followers growth = last followers in window − last followers before window start. */
export function totalsFor(rows: DailyStat[], start: string | null, end: string | null, network?: string): PeriodTotals {
  const scoped = network ? rows.filter((r) => r.network === network) : rows;
  const inWin = scoped.filter((r) => inRange(r.date, start, end));
  const networks = Array.from(new Set(scoped.map((r) => r.network)));
  let followers: number | null = null;
  let growth: number | null = null;
  for (const n of networks) {
    const cur = lastFollowers(scoped, n, start, end);
    if (cur == null) continue;
    followers = (followers ?? 0) + cur;
    if (start) {
      const before = lastFollowers(scoped, n, null, prevDay(start));
      if (before != null) growth = (growth ?? 0) + (cur - before);
    }
  }
  const sum = (k: "views" | "interactions" | "posts") => inWin.reduce((a, r) => a + (r[k] ?? 0), 0);
  return { followers, followersGrowth: growth, views: sum("views"), interactions: sum("interactions"), posts: sum("posts"), hasData: inWin.length > 0 };
}

function prevDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return toISO(d);
}

/** % change vs previous; null when no comparison possible. */
export function pctChange(cur: number, prev: number | null | undefined): number | null {
  if (prev == null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

export const formatNumber = (n: number | null | undefined) =>
  n == null ? "–" : new Intl.NumberFormat("nl-NL", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);

export const formatPct = (p: number | null) => (p == null ? "geen vergelijking" : `${p >= 0 ? "+" : ""}${p.toFixed(1)}% t.o.v. vorige periode`);

const AM = "Europe/Amsterdam";

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
