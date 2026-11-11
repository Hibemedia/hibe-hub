/** Pure helpers for the HIBE agenda (month grid). */
export type AgendaKind = "shoot" | "meeting" | "vacation" | "task";
export type AgendaEntry = { id: string; kind: AgendaKind; title: string; start: string; end: string; time?: string | null; people: string[] };

export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 6x7 grid of days starting on the Monday on/before the 1st of the month. */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i));
}

/** Entries that cover a given day (inclusive range), shoot > meeting > vacation, then time. */
export function entriesOn(day: string, list: AgendaEntry[]): AgendaEntry[] {
  const rank: Record<AgendaKind, number> = { shoot: 0, meeting: 1, task: 2, vacation: 3 };
  return list.filter((e) => e.start <= day && day <= e.end)
    .sort((a, b) => rank[a.kind] - rank[b.kind] || (a.time ?? "").localeCompare(b.time ?? ""));
}

/** People who are on vacation on a day — used to warn when planning a meeting. */
export function absentOn(day: string, list: AgendaEntry[]): string[] {
  return [...new Set(list.filter((e) => e.kind === "vacation" && e.start <= day && day <= e.end).flatMap((e) => e.people))];
}

/** A shoot day added straight from the agenda becomes a real content moment. */
export type ShootDraft = { title: string; client_id: string; date: string; start_time?: string; location?: string; notes?: string };
export function shootRow(d: ShootDraft, me: string) {
  return {
    client_id: d.client_id,
    title: d.title.trim(),
    type: "shoot",
    date: d.date,
    start_time: d.start_time?.trim() || null,
    location: d.location?.trim() || null,
    notes: d.notes?.trim() || null,
    status: "bevestigd",
    requested_by: me || null,
  };
}
