/** Pure helpers for the HIBE dashboard. */
export type TeamRole = "beheerder" | "editor";

/** Growth above 999% is shown as the label "nieuw" instead of a percentage. */
export const isNewGrowth = (pct: number | null | undefined) => pct != null && pct > 999;

/** Fraction of the Monday–Sunday week that has passed (0..1). */
export function weekElapsed(now = new Date()) {
  const dow = (now.getDay() + 6) % 7;
  return (dow * 24 + now.getHours() + now.getMinutes() / 60) / (7 * 24);
}

/** Red when more than half of the week is over and less than half of the target is scheduled. */
export const weekBehind = (done: number, target: number, elapsed: number) => target > 0 && elapsed > 0.5 && done < target / 2;

/** Editors only see Mijn dag, counters and checklist; everything else is for beheerders. Unknown role = editor. */
export const canSeeTotals = (role: TeamRole | null | undefined) => role === "beheerder";

/** Normalised name used to match checklist clients to HIBE clients. */
export const normName = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");

/** Time range the client ranking can be shown over. */
export type RankScope = "week" | "month" | "all";
export const RANK_SCOPES: { key: RankScope; label: string }[] = [
  { key: "week", label: "Deze week" },
  { key: "month", label: "Deze maand" },
  { key: "all", label: "All time" },
];

const AM = "Europe/Amsterdam";
const dayInAm = (now: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: AM, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const DAY = 86400e3;

/**
 * Calendar windows for the ranking (Amsterdam time): the current window plus the
 * previous one of equal length, used for the growth column. "all" never compares.
 */
export function rankingRange(scope: RankScope, now = new Date()) {
  const today = dayInAm(now);
  const d = new Date(`${today}T00:00:00Z`);
  if (scope === "all") return { from: null as string | null, to: today, prevFrom: null as string | null, prevTo: null as string | null };
  if (scope === "week") {
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
    const prevTo = new Date(monday.getTime() - DAY);
    return { from: iso(monday), to: today, prevFrom: iso(new Date(prevTo.getTime() - 6 * DAY)), prevTo: iso(prevTo) };
  }
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const prevTo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0));
  return { from: iso(first), to: today, prevFrom: iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1))), prevTo: iso(prevTo) };
}

/** Footnote explaining what the growth column compares against for a scope. */
export const rankGrowthNote = (scope: RankScope) =>
  scope === "week" ? "Groei = weergaven t.o.v. vorige week."
    : scope === "month" ? "Groei = weergaven t.o.v. vorige maand."
      : "All time telt alles sinds de eerste meting; groei is hier niet van toepassing.";
