export type Member = { id: string; name: string; avatar_url: string | null };

/** Handle used for @mentions: first word of the name, lowercase. */
export const handleOf = (name: string) => name.trim().split(/\s+/)[0].toLowerCase();

/** Team members mentioned as @name in a message (case-insensitive, whole word). */
export function extractMentions(body: string, team: Member[]) {
  const words = new Set((body.toLowerCase().match(/@([\p{L}\p{N}._-]+)/gu) ?? []).map((w) => w.slice(1)));
  return team.filter((m) => words.has(handleOf(m.name))).map((m) => m.id);
}

/** Chat attachments: any file, at most 50 MB. */
export const MAX_FILE = 50 * 1024 * 1024;
export function fileError(f: { type: string; size: number }) {
  if (f.size > MAX_FILE) return "Bestand is groter dan 50 MB";
  return null;
}
/** Stored path looks like room/uuid-name.ext; images render inline. */
export const isImagePath = (path: string) => /\.(png|jpe?g|gif|webp|avif|heic)$/i.test(path);
export const fileNameOf = (path: string) => path.split("/").pop()!.replace(/^[0-9a-f-]{36}-/i, "");

/** Enter sends, Shift+Enter makes a new line. */
export const isSendKey = (e: { key: string; shiftKey: boolean; isComposing?: boolean }) => e.key === "Enter" && !e.shiftKey && !e.isComposing;

export function roomTitle(r: { kind: string; name: string | null }, others: Member[]) {
  if (r.kind === "dm") return others[0]?.name ?? "Direct bericht";
  return r.name || others.map((o) => o.name).join(", ") || "Gesprek";
}
