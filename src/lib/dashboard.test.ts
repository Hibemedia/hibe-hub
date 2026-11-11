// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { isNewGrowth, weekElapsed, weekBehind, canSeeTotals, normName } from "./dashboard";

describe("dashboard rules", () => {
  test("growth above 999% is 'nieuw'", () => {
    expect(isNewGrowth(1000)).toBe(true);
    expect(isNewGrowth(999)).toBe(false);
    expect(isNewGrowth(null)).toBe(false);
  });
  test("week elapsed: Monday 00:00 = 0, Thursday 12:00 = 0.5", () => {
    expect(weekElapsed(new Date(2026, 10, 9, 0, 0))).toBe(0);
    expect(weekElapsed(new Date(2026, 10, 12, 12, 0))).toBe(0.5);
  });
  test("red only when >half week over and <half of target scheduled", () => {
    expect(weekBehind(1, 3, 0.6)).toBe(true);
    expect(weekBehind(2, 3, 0.6)).toBe(false);
    expect(weekBehind(1, 3, 0.5)).toBe(false);
    expect(weekBehind(0, 0, 0.9)).toBe(false);
  });
  test("only beheerders see totals; missing role is editor", () => {
    expect(canSeeTotals("beheerder")).toBe(true);
    expect(canSeeTotals("editor")).toBe(false);
    expect(canSeeTotals(null)).toBe(false);
  });
  test("name matching ignores case and punctuation", () => {
    expect(normName("De Hollandse Tulp")).toBe(normName("de hollandse-tulp"));
  });
});
