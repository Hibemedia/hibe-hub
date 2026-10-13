// Run with: bun test src/lib/medals.test.ts
// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { computeMedals, postStreak } from "./medals";

const v = (id: string, views: number, published_at: string) => ({ id, title: id, views, published_at, network: "ig" });

describe("medals", () => {
  test("biggest video 60K reaches the 50K level, next is 100K", () => {
    const [m] = computeMedals([v("a", 60_000, "2026-01-01"), v("b", 12_000, "2025-12-01")], []);
    expect(m.reached).toBe(50_000);
    expect(m.next).toBe(100_000);
    expect(m.achievedVideo?.id).toBe("a");
  });
  test("total followers sums the last value of every channel", () => {
    const stats = [
      { network: "ig", date: "2026-01-01", followers: 4000, views: 0, posts: 0 },
      { network: "tt", date: "2026-01-02", followers: 2000, views: 0, posts: 0 },
    ];
    const m = computeMedals([], stats)[1];
    expect(m.value).toBe(6000);
    expect(m.reached).toBe(5000);
    expect(m.achievedDate).toBe("2026-01-02");
  });
  test("total views reaching 1M", () => {
    const stats = [{ network: "ig", date: "2026-01-01", followers: null, views: 600_000, posts: 0 }, { network: "ig", date: "2026-01-02", followers: null, views: 500_000, posts: 0 }];
    const m = computeMedals([], stats)[2];
    expect(m.reached).toBe(1_000_000);
    expect(m.achievedDate).toBe("2026-01-02");
  });
  test("videos over 10K counts strictly above 10K", () => {
    const m = computeMedals([v("a", 10_000, "2026-01-01"), v("b", 10_001, "2026-01-02")], [])[3];
    expect(m.value).toBe(1);
  });
  test("weekly streak: current and longest", () => {
    const today = new Date("2026-03-04T12:00:00Z"); // Wednesday
    const s = postStreak(["2026-01-05", "2026-01-12", "2026-01-19", "2026-02-16", "2026-02-23", "2026-03-02"], today);
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });
  test("empty current week does not break the streak", () => {
    const s = postStreak(["2026-02-16", "2026-02-23"], new Date("2026-03-04T12:00:00Z"));
    expect(s.current).toBe(2);
  });
});
