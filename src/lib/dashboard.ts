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
