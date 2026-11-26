export type Script = { id: string; client_id: string; title: string; body: string; link: string | null; moment_id: string | null; shared_with_client: boolean; created_at: string; updated_at: string };

/** Search title + body (case-insensitive) and optional client; newest first. */
export function filterScripts(list: Script[], query: string, clientId: string): Script[] {
  const q = query.trim().toLowerCase();
  return list
    .filter((s) => clientId === "all" || s.client_id === clientId)
    .filter((s) => !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
    .slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type MomentInfo = { title: string; date: string | null };
export type ScriptDayGroup = { id: string | null; label: string; list: Script[] };

/** Group an already-ordered script list into one block per content day, keeping the incoming order. */
export function groupScriptsByDay(list: Script[], dayNames: Record<string, string>): ScriptDayGroup[] {
  const out: ScriptDayGroup[] = [];
  for (const s of list) {
    const id = s.moment_id ?? null;
    const last = out[out.length - 1];
    if (last && last.id === id) last.list.push(s);
    else out.push({ id, label: id ? dayNames[id] ?? "Draaidag" : "Zonder draaidag", list: [s] });
  }
  return out;
}

/** Is this day block open? A search or filter always opens everything; otherwise the click wins. */
export function dayBlockOpen(
  groupId: string | null,
  openDays: Record<string, boolean>,
  opts: { collapsible: boolean; filterActive: boolean; selectedMomentId: string | null | undefined },
): boolean {
  if (!opts.collapsible || opts.filterActive) return true;
  const key = groupId ?? "__none";
  if (openDays[key] === false) return false;
  if (openDays[key] === true) return true;
  return opts.selectedMomentId === groupId;
}

/** Scripts linked to a content day that has a date, most recent day first. */
export function usedScripts(list: Script[], moments: Record<string, MomentInfo>) {
  return list
    .filter((s) => s.moment_id && moments[s.moment_id]?.date)
    .map((s) => ({ script: s, moment: moments[s.moment_id!] }))
    .sort((a, b) => b.moment.date!.localeCompare(a.moment.date!));
}
