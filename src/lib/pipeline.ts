/** Pure helpers for the HIBE Productieboard (read-only view over tasks, shoots, edits and videos). */
export type PhaseKey = "script" | "shoot" | "plan" | "edit" | "check" | "client" | "final" | "done";
export const PHASES: { key: PhaseKey; label: string; owner: string }[] = [
  { key: "script", label: "Script", owner: "Redactie" },
  { key: "shoot", label: "Draaidag", owner: "Crew" },
  { key: "plan", label: "Inplannen", owner: "Media management" },
  { key: "edit", label: "Montage", owner: "Editor" },
  { key: "check", label: "Check & subs", owner: "Media management" },
  { key: "client", label: "Klant review", owner: "Klant / editor" },
  { key: "final", label: "Final inplannen", owner: "Media management" },
  { key: "done", label: "Ingepland", owner: "Afgerond, laatste 7 dagen" },
];
export type Card = { id: string; phase: PhaseKey; title: string; client_id: string | null; since: string; turn: string; round?: number; href: string; person?: string | null };

const DAY = 86_400_000;
export const daysIn = (since: string, now: Date) => Math.max(0, Math.floor((now.getTime() - new Date(since).getTime()) / DAY));
/** <3 days on track, 3–5 attention, >5 delayed. */
export const ageTone = (d: number): "ok" | "warn" | "late" => (d > 5 ? "late" : d >= 3 ? "warn" : "ok");
export const isScriptTask = (title: string) => /script|redactie/i.test(title);

type T = { id: string; title: string; client_id: string | null; assignee_id: string; done_at: string | null; created_at: string };
type M = { id: string; title: string; client_id: string; type: string; status: string; date: string | null; created_at: string };
type E = { id: string; title: string; client_id: string; editor_id: string | null; status: string; created_at: string; updated_at?: string | null };
type V = { id: string; title: string; client_id: string; status: string; current_version: number; archived_at: string | null; status_changed_at: string };

/** Scheduled videos stay visible as "done" for this many days. */
export const DONE_DAYS = 7;
export function buildCards(d: { tasks: T[]; moments: M[]; edits: E[]; videos: V[] }, today: string, now: Date = new Date()): Card[] {
  const out: Card[] = [];
  for (const t of d.tasks) if (!t.done_at && isScriptTask(t.title))
    out.push({ id: "t" + t.id, phase: "script", title: t.title, client_id: t.client_id, since: t.created_at, turn: "Redactie", href: "/hibe/taken", person: t.assignee_id });
  for (const m of d.moments) if (m.type === "shoot" && !["cancelled", "geannuleerd"].includes(m.status) && (!m.date || m.date >= today))
    out.push({ id: "m" + m.id, phase: "shoot", title: m.title, client_id: m.client_id, since: m.created_at, turn: "Crew", href: "/hibe/contentmomenten" });
  for (const e of d.edits) {
    const since = e.updated_at ?? e.created_at;
    if (e.status === "assign") out.push({ id: "e" + e.id, phase: "plan", title: e.title, client_id: e.client_id, since, turn: "Media management", href: "/hibe/edits" });
    else if (["todo", "editing", "on_hold"].includes(e.status)) out.push({ id: "e" + e.id, phase: "edit", title: e.title, client_id: e.client_id, since, turn: e.status === "on_hold" ? "On hold" : "Editor", href: "/hibe/edits", person: e.editor_id });
  }
  for (const v of d.videos) {
    if (v.archived_at) continue;
    const base = { id: "v" + v.id, title: v.title, client_id: v.client_id, since: v.status_changed_at, href: `/hibe/videos/${v.id}` };
    if (v.status === "internal_review") out.push({ ...base, phase: "check", turn: "Media management" });
    else if (v.status === "approved_internal") out.push({ ...base, phase: "check", turn: "CapCut / subs" });
    else if (v.status === "client_review") out.push({ ...base, phase: "client", turn: "Klant", round: Math.max(1, v.current_version - 1) });
    else if (v.status === "feedback") out.push({ ...base, phase: "client", turn: "Feedback verwerken", round: Math.max(1, v.current_version - 1) });
    else if (v.status === "approved_client") out.push({ ...base, phase: "final", turn: "Media management" });
    else if (v.status === "scheduled" && daysIn(v.status_changed_at, now) < DONE_DAYS) out.push({ ...base, phase: "done", turn: "Ingepland" });
  }
  return out;
}
export const avgDays = (cards: Card[], now: Date) => (cards.length ? Math.round(cards.reduce((s, c) => s + daysIn(c.since, now), 0) / cards.length * 10) / 10 : null);
