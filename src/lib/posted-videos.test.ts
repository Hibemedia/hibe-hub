// @ts-ignore project tests run with Bun
import { describe, expect, test } from "bun:test";
import { groupPosted } from "./posted-videos";
const r = (id: string, network: string, title: string | null, views: number, d: string) => ({ id, network, title, views, published_at: d, url: null, thumbnail_url: null });
describe("groupPosted", () => {
  test("same video on Instagram and TikTok counts once with summed views", () => {
    const g = groupPosted([r("1", "instagram", "Sneeuwvrij?!", 500, "2026-01-07"), r("2", "tiktok", "sneeuwvrij", 80, "2026-01-08")]);
    expect(g.length).toBe(1);
    expect(g[0].views).toBe(580);
    expect(g[0].posts.map((p) => p.network)).toEqual(["instagram", "tiktok"]);
  });
  test("different videos stay separate", () => {
    expect(groupPosted([r("1", "instagram", "A", 1, "2026-01-07"), r("2", "tiktok", "B", 1, "2026-01-07")]).length).toBe(2);
  });
  test("same caption months apart or on the same channel stays separate", () => {
    expect(groupPosted([r("1", "instagram", "A", 1, "2026-01-07"), r("2", "tiktok", "A", 1, "2026-05-07")]).length).toBe(2);
    expect(groupPosted([r("1", "instagram", "A", 1, "2026-01-07"), r("2", "instagram", "A", 1, "2026-01-08")]).length).toBe(2);
  });
  test("videos without a title are never merged", () => {
    expect(groupPosted([r("1", "instagram", null, 1, "2026-01-07"), r("2", "tiktok", null, 1, "2026-01-07")]).length).toBe(2);
  });
});
