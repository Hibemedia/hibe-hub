/** Pure helpers for the HIBE agenda (month grid). */
export type AgendaKind = "shoot" | "meeting" | "vacation" | "task" | "edit";
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
  const rank: Record<AgendaKind, number> = { shoot: 0, meeting: 1, edit: 2, task: 3, vacation: 4 };
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

/** Monday..Friday of the week containing d. */
export function workWeek(d: Date): Date[] {
  const off = (d.getDay() + 6) % 7;
  return Array.from({ length: 5 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - off + i));
}

/** Workload points: shoot 3, edit 2, meeting 1, task 1; vacation means unavailable. */
export const LOAD: Record<AgendaKind, number> = { shoot: 3, edit: 2, meeting: 1, task: 1, vacation: 0 };
export const DAY_CAPACITY = 4;
export type DayLoad = { load: number; level: "free" | "ok" | "full" | "over" };
export function personDayLoad(person: string, day: string, list: AgendaEntry[]): DayLoad & { away: boolean } {
  const mine = entriesOn(day, list).filter((e) => e.people.includes(person));
  const away = mine.some((e) => e.kind === "vacation");
  const load = mine.reduce((n, e) => n + LOAD[e.kind], 0);
  const level = load === 0 ? "free" : load < DAY_CAPACITY ? "ok" : load === DAY_CAPACITY ? "full" : "over";
  return { load, level: away && load > 0 ? "over" : level, away };
}
/** Team-wide occupancy for one day: busy people vs available (not on vacation). */
export function teamDayLoad(people: string[], day: string, list: AgendaEntry[]) {
  const rows = people.map((p) => personDayLoad(p, day, list));
  const available = rows.filter((r) => !r.away).length;
  return { available, busy: rows.filter((r) => !r.away && r.load > 0).length, overloaded: rows.filter((r) => r.level === "over").length, load: rows.reduce((n, r) => n + r.load, 0), capacity: available * DAY_CAPACITY };
}
