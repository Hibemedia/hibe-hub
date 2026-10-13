// Run with: bun test src/lib/stats.test.ts
// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { totalsFor, pctChange, periodRange } from "./stats";

const row = (date: string, followers: number, views = 0) => ({ network: "ig", date, followers, views, interactions: 0, posts: 0 });

describe("stats", () => {
  test("followers growth = last in period minus last before period", () => {
    const rows = [row("2026-01-01", 100), row("2026-01-05", 120), row("2026-01-10", 150), row("2026-01-12", 160)];
    const t = totalsFor(rows, "2026-01-08", "2026-01-14");
    expect(t.followers).toBe(160);
    expect(t.followersGrowth).toBe(40);
  });
  test("pct change vs previous period", () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(10, 0)).toBeNull();
  });
  test("7 day range is 7 days inclusive, previous adjacent", () => {
    const r = periodRange("7d", new Date("2026-10-13T12:00:00Z"));
    expect(r).toEqual({ start: "2026-10-07", end: "2026-10-13", prevStart: "2026-09-30", prevEnd: "2026-10-06" });
  });
});
