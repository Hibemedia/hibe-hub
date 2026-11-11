/** Pure helpers for the HIBE task list (Taken). */
export type Task = { id: string; title: string; notes: string | null; client_id: string | null; assignee_id: string; due_date: string | null; due_time: string | null; done_at: string | null; created_by: string | null; created_at: string };

/** Only beheerders may give tasks to someone else; editors plan only for themselves. */
export const canAssignTo = (role: string | null | undefined, me: string, assignee: string) => assignee === me || role === "beheerder";

export const isOverdue = (t: Pick<Task, "due_date" | "done_at">, today: string) => !t.done_at && !!t.due_date && t.due_date < today;

/** Open tasks first, then by due date (no date last), then time; done tasks last, newest done first. */
export function sortTasks<T extends Pick<Task, "due_date" | "due_time" | "done_at" | "created_at">>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (!!a.done_at !== !!b.done_at) return a.done_at ? 1 : -1;
    if (a.done_at && b.done_at) return b.done_at.localeCompare(a.done_at);
    const ad = a.due_date ?? "9999", bd = b.due_date ?? "9999";
    return ad.localeCompare(bd) || (a.due_time ?? "").localeCompare(b.due_time ?? "") || a.created_at.localeCompare(b.created_at);
  });
}

/** Group tasks per person, keeping the order of `people`; people without tasks are dropped. */
export function groupByPerson<T extends Pick<Task, "assignee_id">>(list: T[], people: string[]): { person: string; tasks: T[] }[] {
  const ids = [...people, ...list.map((t) => t.assignee_id).filter((p) => !people.includes(p))];
  return [...new Set(ids)].map((person) => ({ person, tasks: list.filter((t) => t.assignee_id === person) })).filter((g) => g.tasks.length);
}
