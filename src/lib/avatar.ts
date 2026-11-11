/** Fixed palette slot (1–8) per person, so the same person always gets the same colour. */
export function avatarSlot(key: string): number {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 8) + 1;
}
/** Up to two initials from a name or e-mail. */
export function initials(name: string): string {
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("") || "?";
}
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png"];
export function avatarFileError(f: { type: string; size: number }): string | null {
  if (!AVATAR_TYPES.includes(f.type)) return "Kies een JPG- of PNG-bestand";
  if (f.size > AVATAR_MAX_BYTES) return "De foto is groter dan 5 MB";
  return null;
}
