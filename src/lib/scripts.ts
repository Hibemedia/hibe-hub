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
/** Scripts linked to a content day that has a date, most recent day first. */
export function usedScripts(list: Script[], moments: Record<string, MomentInfo>) {
  return list
    .filter((s) => s.moment_id && moments[s.moment_id]?.date)
    .map((s) => ({ script: s, moment: moments[s.moment_id!] }))
    .sort((a, b) => b.moment.date!.localeCompare(a.moment.date!));
}
