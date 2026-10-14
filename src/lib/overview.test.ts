// Run with: bun test src/lib/overview.test.ts
// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { selectBestVideo, selectUpcomingMoments } from "./overview";
import type { VideoRow } from "@/hooks/useClientStats";

const video = (id: string, date: string, views: number | null): VideoRow => ({
  id, network: "ig", external_id: id, published_at: date, views,
  title: id, url: null, thumbnail_url: null, likes: null, comments: null, shares: null, saves: null,
});
const moment = (id: string, date: string | null, status = "gepland", start_time: string | null = null) => ({
  id, title: id, date, status, start_time, location: null,
});

describe("compact overview selection", () => {
  test("one most viewed video within the selected period, including both boundaries", () => {
    const rows = [video("old", "2026-09-01", 999999), video("future", "2026-10-15", 999999),
      video("first", "2026-10-01", 100), video("best", "2026-10-14T18:00:00Z", 500), video("unknown", "2026-10-10", null)];
    expect(selectBestVideo(rows, "2026-10-01", "2026-10-14")?.id).toBe("best");
  });
  test("all-time video selection still excludes dates after the period end", () => {
    expect(selectBestVideo([video("old", "2025-01-01", 500), video("future", "2026-10-15", 1000)], null, "2026-10-14")?.id).toBe("old");
  });
  test("no video is represented by null rather than an invented zero", () => {
    expect(selectBestVideo([], null, "2026-10-14")).toBeNull();
    expect(selectBestVideo([video("missing", "2026-10-14", null)], null, "2026-10-14")).toBeNull();
  });
  test("only the three earliest future confirmed or planned moments", () => {
    const rows = [moment("fourth", "2026-10-18"), moment("third", "2026-10-17"), moment("first", "2026-10-15", "bevestigd"),
      moment("second", "2026-10-16"), moment("requested", "2026-10-15", "aangevraagd"), moment("cancelled", "2026-10-15", "geannuleerd"),
      moment("done", "2026-10-15", "afgerond"), moment("undated", null), moment("past", "2026-10-13")];
    expect(selectUpcomingMoments(rows, new Date("2026-10-14T08:22:00Z")).map((m) => m.id)).toEqual(["first", "second", "third"]);
  });
  test("today uses Amsterdam time and excludes elapsed start times", () => {
    const rows = [moment("past-hour", "2026-10-14", "gepland", "09:30"), moment("later", "2026-10-14", "bevestigd", "11:00"), moment("no-time", "2026-10-14")];
    expect(selectUpcomingMoments(rows, new Date("2026-10-14T08:22:00Z")).map((m) => m.id)).toEqual(["later", "no-time"]);
  });
});