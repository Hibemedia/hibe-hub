import { WORKFLOW } from "./workflow";
/** Pure helpers for the HIBE Productieboard (read-only view over tasks, shoots, edits and videos). */
export type PhaseKey = "script" | "shoot" | "plan" | "edit" | "check" | "capcut" | "feedback" | "ready" | "client" | "final" | "done";
export const PHASES: { key: PhaseKey; label: string; owner: string }[] = [
  { key: "script", label: "Script", owner: "Redactie" },
  { key: "shoot", label: "Draaidag", owner: "Crew" },
  { key: "plan", label: WORKFLOW.plan.label, owner: "Media management" },
  { key: "edit", label: WORKFLOW.edit.label, owner: "Editor" },
  { key: "check", label: WORKFLOW.internal_review.label, owner: "Media management" },
  { key: "feedback", label: WORKFLOW.feedback.label, owner: "Editor" },
  { key: "capcut", label: WORKFLOW.approved_internal.label, owner: "Editor" },
  { key: "ready", label: WORKFLOW.ready_for_client.label, owner: "Media management" },
  { key: "client", label: WORKFLOW.client_review.label, owner: "Klant / editor" },
  { key: "final", label: WORKFLOW.approved_client.label, owner: "Media management" },
  { key: "done", label: "Ingepland", owner: "Afgerond, laatste 7 dagen" },
];
export type Card = { id: string; phase: PhaseKey; title: string; client_id: string | null; since: string; turn: string; round?: number; href: string; person?: string | null };

const DAY = 86_400_000;
export const daysIn = (since: string, now: Date) => Math.max(0, Math.floor((now.getTime() - new Date(since).getTime()) / DAY));
/** <3 days on track, 3–5 attention, >5 delayed. */
export const ageTone = (d: number): "ok" | "warn" | "late" => (d > 5 ? "late" : d >= 3 ? "warn" : "ok");
export const isScriptTask = (title: string) => /script|redactie/i.test(title);

type T = { id: string; title: string; client_id: string | null; assignee_id: string; done_at: string | null; created_at: string; moment_id?: string | null };
type M = { id: string; title: string; client_id: string; type: string; status: string; date: string | null; created_at: string };
type E = { id: string; title: string; client_id: string; editor_id: string | null; status: string; created_at: string; updated_at?: string | null };
type V = { id: string; title: string; client_id: string; status: string; current_version: number; archived_at: string | null; status_changed_at: string };

/** Scheduled videos stay visible as "done" for this many days. */
export const DONE_DAYS = 7;
/** A shoot linked to at least one edit (edits.moment_id) is done: it leaves the Draaidag column. */
export function buildCards(d: { tasks: T[]; moments: M[]; edits: E[]; videos: V[]; linkedMoments?: string[] }, today: string, now: Date = new Date()): Card[] {
  const out: Card[] = [];
  const linked = new Set(d.linkedMoments ?? []);
  // A script task linked to a shoot leaves the Script column once that shoot has an edit.
  for (const t of d.tasks) if (!t.done_at && isScriptTask(t.title) && !(t.moment_id && linked.has(t.moment_id)))
    out.push({ id: "t" + t.id, phase: "script", title: t.title, client_id: t.client_id, since: t.created_at, turn: "Redactie", href: "/hibe/taken", person: t.assignee_id });
  for (const m of d.moments) if (m.type === "shoot" && !["cancelled", "geannuleerd"].includes(m.status) && (!m.date || m.date >= today) && !linked.has(m.id))
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
    else if (v.status === "approved_internal") out.push({ ...base, phase: "capcut", turn: "CapCut" });
    else if (v.status === "client_review") out.push({ ...base, phase: "client", turn: "Klant", round: Math.max(1, v.current_version - 1) });
    else if (v.status === "feedback") out.push({ ...base, phase: "feedback", turn: "Feedback verwerken", round: Math.max(1, v.current_version - 1) });
    else if (v.status === "ready_for_client") out.push({ ...base, phase: "ready", turn: "Media management" });
    else if (v.status === "approved_client") out.push({ ...base, phase: "final", turn: "Media management" });
    else if (v.status === "scheduled" && daysIn(v.status_changed_at, now) < DONE_DAYS) out.push({ ...base, phase: "done", turn: "Ingepland" });
  }
  return out;
}
export const avgDays = (cards: Card[], now: Date) => (cards.length ? Math.round(cards.reduce((s, c) => s + daysIn(c.since, now), 0) / cards.length * 10) / 10 : null);

/** SLA: a video counts as delivered in the month its status became "scheduled". */
export function deliveredThisMonth(videos: { client_id: string; status: string; status_changed_at: string }[], now: Date = new Date()) {
  const counts: Record<string, number> = {};
  for (const v of videos) {
    if (v.status !== "scheduled") continue;
    const d = new Date(v.status_changed_at);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) counts[v.client_id] = (counts[v.client_id] ?? 0) + 1;
  }
  return counts;
}
/** Weekly SLA: target/4 per week, checked only at the end of each finished week (day 7/14/21/28). Running week never counts. Short 1 = attention, 2+ = behind. */
export type SlaTone = "none" | "met" | "ok" | "attention" | "behind";
export function slaTone(done: number, target: number | null, now: Date = new Date()): SlaTone {
  if (!target) return "none";
  if (done >= target) return "met";
  const weeks = Math.min(4, Math.floor((now.getDate() - 1) / 7));
  const short = Math.round((target * weeks) / 4) - done;
  return short <= 0 ? "ok" : short === 1 ? "attention" : "behind";
}

export type ClientRow = { client_id: string; cards: Card[]; phases: Record<PhaseKey, { n: number; maxDays: number }>; maxWait: number; clientWait: number };
/** One row per client: per-phase count + oldest wait; sorted by longest open wait (done excluded). sort="client" sorts by wait in Klant review. */
export function groupByClient(cards: Card[], now: Date, sort: "wait" | "client" = "wait"): ClientRow[] {
  const map = new Map<string, ClientRow>();
  for (const c of cards) {
    if (!c.client_id) continue;
    let r = map.get(c.client_id);
    if (!r) {
      r = { client_id: c.client_id, cards: [], phases: Object.fromEntries(PHASES.map((p) => [p.key, { n: 0, maxDays: 0 }])) as ClientRow["phases"], maxWait: 0, clientWait: 0 };
      map.set(c.client_id, r);
    }
    const d = daysIn(c.since, now);
    r.cards.push(c);
    const ph = r.phases[c.phase]; ph.n++; ph.maxDays = Math.max(ph.maxDays, d);
    if (c.phase !== "done") r.maxWait = Math.max(r.maxWait, d);
    if (c.phase === "client") r.clientWait = Math.max(r.clientWait, d);
  }
  const key = (r: ClientRow) => (sort === "client" ? r.clientWait : r.maxWait);
  return [...map.values()].sort((a, b) => key(b) - key(a) || b.maxWait - a.maxWait);
}
