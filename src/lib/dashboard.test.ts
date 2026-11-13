// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { isNewGrowth, weekElapsed, weekBehind, canSeeTotals, normName, rankingRange, rankGrowthNote, RANK_SCOPES } from "./dashboard";

// Friday 13 November 2026, 09:00 UTC = 10:00 Amsterdam.
const FRI = new Date(Date.UTC(2026, 10, 13, 9, 0));

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

describe("ranking ranges", () => {
  test("week runs Monday to today and compares with the previous week", () => {
    expect(rankingRange("week", FRI)).toEqual({ from: "2026-11-09", to: "2026-11-13", prevFrom: "2026-11-02", prevTo: "2026-11-08" });
  });
  test("month runs from the 1st to today and compares with the whole previous month", () => {
    expect(rankingRange("month", FRI)).toEqual({ from: "2026-11-01", to: "2026-11-13", prevFrom: "2026-10-01", prevTo: "2026-10-31" });
  });
  test("all time has no comparison window", () => {
    expect(rankingRange("all", FRI)).toEqual({ from: null, to: "2026-11-13", prevFrom: null, prevTo: null });
  });
  test("January compares with December of the previous year", () => {
    expect(rankingRange("month", new Date(Date.UTC(2027, 0, 5, 9, 0)))).toEqual({ from: "2027-01-01", to: "2027-01-05", prevFrom: "2026-12-01", prevTo: "2026-12-31" });
  });
  test("on Monday the week window is that single day", () => {
    expect(rankingRange("week", new Date(Date.UTC(2026, 10, 9, 9, 0)))).toEqual({ from: "2026-11-09", to: "2026-11-09", prevFrom: "2026-11-02", prevTo: "2026-11-08" });
  });
  test("the footnote names the comparison that is shown", () => {
    expect(rankGrowthNote("week")).toContain("vorige week");
    expect(rankGrowthNote("month")).toContain("vorige maand");
    expect(RANK_SCOPES.map((s) => s.label)).toEqual(["Deze week", "Deze maand", "All time"]);
  });
});
