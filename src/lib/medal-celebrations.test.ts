// @ts-ignore bun types are not installed in the app tsconfig
import { describe, expect, test } from "bun:test";
import { almostThereRemaining, canCelebrate, celebrationKey, medalMaterial } from "./medal-celebrations";
import { computeMedals } from "./medals";

describe("medal celebrations", () => {
  test("4.8 million towards 5 million leaves 200K", () => {
    expect(almostThereRemaining({ value: 4_800_000, next: 5_000_000 })).toBe(200_000);
  });
  test("almost-there requires strictly more than 85%", () => {
    expect(almostThereRemaining({ value: 850, next: 1000 })).toBeNull();
    expect(almostThereRemaining({ value: 851, next: 1000 })).toBe(149);
  });
  test("maxed out milestones have no almost-there message", () => {
    expect(almostThereRemaining({ value: 5_000_000, next: null })).toBeNull();
  });
  test("levels 1-2 bronze, 3 silver, 4 gold and 5+ diamond", () => {
    expect([0, 1, 2, 3, 4, 5, 7].map(medalMaterial)).toEqual(["bronze", "bronze", "silver", "gold", "diamond", "diamond", "diamond"]);
  });
  test("only uncelebrated achieved levels or maxed levels get the prominent action", () => {
    const medals = computeMedals([], [{ network: "ig", date: "2026-10-14", followers: 50_000, views: 10_000_000, posts: 0 }]);
    expect(canCelebrate(medals[0], false)).toBe(false);
    expect(canCelebrate(medals[1], false)).toBe(true);
    expect(canCelebrate(medals[1], true)).toBe(false);
    expect(canCelebrate(medals[2], true)).toBe(true);
  });
  test("celebration acknowledgement stays separate by client and level", () => {
    const m = computeMedals([], [{ network: "ig", date: "2026-10-14", followers: 50_000, views: 0, posts: 0 }])[1];
    expect(celebrationKey("a", m)).not.toBe(celebrationKey("b", m));
    expect(celebrationKey("a", m)).not.toBe(celebrationKey("a", { ...m, reached: 100_000 }));
  });
});