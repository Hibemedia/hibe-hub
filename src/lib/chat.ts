export type Member = { id: string; name: string; avatar_url: string | null };

/** Handle used for @mentions: first word of the name, lowercase. */
export const handleOf = (name: string) => name.trim().split(/\s+/)[0].toLowerCase();

/** Team members mentioned as @name in a message (case-insensitive, whole word). */
export function extractMentions(body: string, team: Member[]) {
  const words = new Set((body.toLowerCase().match(/@([\p{L}\p{N}._-]+)/gu) ?? []).map((w) => w.slice(1)));
  return team.filter((m) => words.has(handleOf(m.name))).map((m) => m.id);
}

/** Chat images: images only, at most 10 MB. */
export const MAX_IMAGE = 10 * 1024 * 1024;
export function imageError(f: { type: string; size: number }) {
  if (!f.type.startsWith("image/")) return "Alleen afbeeldingen kunnen worden meegestuurd";
  if (f.size > MAX_IMAGE) return "Afbeelding is groter dan 10 MB";
  return null;
}

/** Enter sends, Shift+Enter makes a new line. */
export const isSendKey = (e: { key: string; shiftKey: boolean; isComposing?: boolean }) => e.key === "Enter" && !e.shiftKey && !e.isComposing;

export function roomTitle(r: { kind: string; name: string | null }, others: Member[]) {
  if (r.kind === "dm") return others[0]?.name ?? "Direct bericht";
  return r.name || others.map((o) => o.name).join(", ") || "Gesprek";
}
