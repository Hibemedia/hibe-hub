export type CrewRow = { moment_id: string; user_id: string; role: string | null };
export type CrewMoment = { id: string; date: string | null; type: string; status: string };

/** Other non-cancelled shoot days on the same date that this person is already on. */
export function crewConflicts(userId: string, moment: CrewMoment, moments: CrewMoment[], crew: CrewRow[]): CrewMoment[] {
  if (!moment.date) return [];
  const mine = new Set(crew.filter((c) => c.user_id === userId).map((c) => c.moment_id));
  return moments.filter((m) => m.id !== moment.id && m.date === moment.date && m.status !== "geannuleerd" && mine.has(m.id));
}

/** A shoot day without crew gets the orange "Nog niemand ingepland" label. */
export const needsCrew = (m: CrewMoment, crewCount: number) => m.type === "shoot" && m.status !== "geannuleerd" && crewCount === 0;

/** Upcoming shoot days of one team member, sorted by date. */
export function shootDaysOf<T extends CrewMoment>(userId: string, moments: T[], crew: CrewRow[], today: string): T[] {
  const ids = new Set(crew.filter((c) => c.user_id === userId).map((c) => c.moment_id));
  return moments.filter((m) => ids.has(m.id) && (!m.date || m.date >= today)).sort((a, b) => (a.date ?? "9").localeCompare(b.date ?? "9"));
}
