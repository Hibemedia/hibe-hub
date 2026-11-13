import type { AgendaEntry, AgendaKind } from "./agenda";

export const AGENDA_KINDS: AgendaKind[] = ["shoot", "edit", "meeting", "task", "vacation"];
export const AGENDA_LABELS: Record<AgendaKind, string> = { shoot: "Draaidag", edit: "Montage", meeting: "Meeting", task: "Taak", vacation: "Vrij" };
const URL_KINDS: Record<AgendaKind, string> = { shoot: "draaidag", edit: "montage", meeting: "meeting", task: "taak", vacation: "vrij" };
export type AgendaFilters = { who: "everyone" | "me" | "team"; people: string[]; kinds: AgendaKind[]; clients: string[] };
export const defaultAgendaFilters = (): AgendaFilters => ({ who: "everyone", people: [], kinds: [...AGENDA_KINDS], clients: [] });
export const hasAgendaFilters = (f: AgendaFilters) => f.who !== "everyone" || f.kinds.length !== AGENDA_KINDS.length || f.clients.length > 0;
export const hasAgendaParams = (p: URLSearchParams) => ["wie", "team", "type", "klant"].some((k) => p.has(k));
const ids = (value: string | null) => [...new Set((value ?? "").split(",").filter(Boolean))];

export function readAgendaFilters(p: URLSearchParams): AgendaFilters {
  return {
    who: p.get("wie") === "ik" ? "me" : p.get("wie") === "team" ? "team" : "everyone",
    people: ids(p.get("team")),
    kinds: p.has("type") ? AGENDA_KINDS.filter((k) => ids(p.get("type")).includes(URL_KINDS[k])) : [...AGENDA_KINDS],
    clients: ids(p.get("klant")),
  };
}

export function writeAgendaFilters(f: AgendaFilters, previous = new URLSearchParams()): URLSearchParams {
  const p = new URLSearchParams(previous);
  ["wie", "team", "type", "klant"].forEach((k) => p.delete(k));
  // Explicit default prevents an old saved selection overriding a shared/reset URL.
  p.set("wie", f.who === "me" ? "ik" : f.who === "team" ? "team" : "iedereen");
  if (f.who === "team" && f.people.length) p.set("team", f.people.join(","));
  if (f.kinds.length !== AGENDA_KINDS.length) p.set("type", f.kinds.map((k) => URL_KINDS[k]).join(","));
  if (f.clients.length) p.set("klant", f.clients.join(","));
  return p;
}

export function filterAgendaEntries(entries: AgendaEntry[], f: AgendaFilters, me: string): AgendaEntry[] {
  return entries.filter((e) =>
    f.kinds.includes(e.kind) &&
    (f.who === "everyone" || (f.who === "me" ? e.people.includes(me) : e.people.some((id) => f.people.includes(id)))) &&
    (f.clients.length === 0 || (!!e.clientId && f.clients.includes(e.clientId))),
  );
}

export function agendaDayPreview(entries: AgendaEntry[]) {
  return { visible: entries.length >= 3 ? entries.slice(0, 1) : entries, more: entries.length >= 3 ? entries.length - 1 : 0 };
}