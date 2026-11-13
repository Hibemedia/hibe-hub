type FilterableMoment = { id: string; client_id: string; status: string };
export function filterMomentStatus<T extends FilterableMoment>(moments: T[], statuses: string[]) {
  return moments.filter((m) => statuses.includes(m.status));
}
/** Only an actual attached image is shown, never a fabricated client image or placeholder. */
export function momentReferenceImage(moment: { thumbnail_url?: string | null; reference_image_url?: string | null }) {
  const url = moment.thumbnail_url || moment.reference_image_url;
  if (!url) return null;
  try { return new URL(url).protocol === "https:" ? url : null; } catch { return null; }
}
export const crewOverflow = (count: number, visible = 3) => Math.max(0, count - visible);