import type { Medal } from "./medals";

export function medalMaterial(levelIndex: number) {
  const level = levelIndex + 1;
  if (level >= 5) return "diamond";
  if (level === 4) return "gold";
  if (level === 3) return "silver";
  return "bronze";
}

export function almostThereRemaining(medal: Pick<Medal, "value" | "next">): number | null {
  if (medal.next == null || medal.next <= 0 || medal.value >= medal.next) return null;
  return medal.value / medal.next > 0.85 ? medal.next - medal.value : null;
}

export function celebrationKey(clientId: string, medal: Medal) {
  return `hibe:celebrated:${clientId}:${medal.key}:${medal.reached}`;
}

export function canCelebrate(medal: Medal, alreadyCelebrated: boolean) {
  return medal.levelIndex >= 0 && (!alreadyCelebrated || medal.next == null);
}