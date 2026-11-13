type FilterableMoment = { id: string; client_id: string; status: string };
/** Legacy planned records are confirmed; retain their stored values. */
export const normalizeMomentStatus = (status: string) => status === "gepland" ? "bevestigd" : status;
export function filterMomentStatus<T extends FilterableMoment>(moments: T[], statuses: string[]) {
  const selected = statuses.map(normalizeMomentStatus);
  return moments.filter((m) => selected.includes(normalizeMomentStatus(m.status)));
}
/** Only an actual attached image is shown, never a fabricated client image or placeholder. */
export function momentReferenceImage(moment: { thumbnail_url?: string | null; reference_image_url?: string | null }) {
  const url = moment.thumbnail_url || moment.reference_image_url;
  if (!url) return null;
  try { return new URL(url).protocol === "https:" ? url : null; } catch { return null; }
}
export const crewOverflow = (count: number, visible = 3) => Math.max(0, count - visible);

const AM = "Europe/Amsterdam";
/** Today's calendar date in Amsterdam, as YYYY-MM-DD. */
export function amsterdamToday(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AM, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
const ACTIVE = new Set(["aangevraagd", "bevestigd", "gepland"]);
/**
 * A moment whose date has passed reads as finished. The stored status is never
 * overwritten: an explicit "geannuleerd" or "afgerond" always wins.
 */
export function momentStatus<T extends { status: string; date?: string | null }>(m: T, today = amsterdamToday()) {
  return ACTIVE.has(m.status) && !!m.date && m.date < today ? "afgerond" : normalizeMomentStatus(m.status);
}
