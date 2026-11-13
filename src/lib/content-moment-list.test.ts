// @ts-ignore bun provides its own test types
import { it, expect } from "bun:test";
import { crewOverflow, filterMomentStatus, momentReferenceImage, momentStatus, amsterdamToday, normalizeMomentStatus } from "./content-moment-list";
it("five team members have three visible avatars and two remaining", () => {
  expect(crewOverflow(5)).toBe(2);
  expect(crewOverflow(3)).toBe(0);
});
it("status multiselect includes only selected statuses", () => {
  const ms = [{ id: "1", client_id: "vip", status: "bevestigd" }, { id: "2", client_id: "glu", status: "afgerond" }, { id: "3", client_id: "vip", status: "gepland" }];
  expect(filterMomentStatus(ms, ["bevestigd", "gepland"]).map((m) => m.id)).toEqual(["1", "3"]);
  expect(filterMomentStatus(ms, [])).toEqual([]);
});
it("no image means no placeholder and attached reference images are retained", () => {
  expect(momentReferenceImage({})).toBeNull();
  expect(momentReferenceImage({ reference_image_url: "https://example.org/moodboard.jpg" })).toBe("https://example.org/moodboard.jpg");
  expect(momentReferenceImage({ thumbnail_url: "javascript:alert(1)" })).toBeNull();
});
it("a moment whose date has passed reads as afgerond without touching the stored status", () => {
  expect(momentStatus({ status: "bevestigd", date: "2026-11-12" }, "2026-11-13")).toBe("afgerond");
  expect(momentStatus({ status: "aangevraagd", date: "2026-11-12" }, "2026-11-13")).toBe("afgerond");
  expect(momentStatus({ status: "gepland", date: "2026-11-12" }, "2026-11-13")).toBe("afgerond");
});
it("today, the future, undated and cancelled moments keep their own status", () => {
  expect(momentStatus({ status: "bevestigd", date: "2026-11-13" }, "2026-11-13")).toBe("bevestigd");
  expect(momentStatus({ status: "gepland", date: "2026-12-03" }, "2026-11-13")).toBe("bevestigd");
  expect(momentStatus({ status: "bevestigd", date: null }, "2026-11-13")).toBe("bevestigd");
  expect(momentStatus({ status: "geannuleerd", date: "2026-11-12" }, "2026-11-13")).toBe("geannuleerd");
  expect(momentStatus({ status: "afgerond", date: "2026-11-12" }, "2026-11-13")).toBe("afgerond");
});
it("amsterdamToday returns a YYYY-MM-DD date", () => {
  expect(amsterdamToday(new Date("2026-11-13T09:57:00Z"))).toBe("2026-11-13");
});
it("planned and confirmed moments are a single confirmed status and filter", () => {
  expect(normalizeMomentStatus("gepland")).toBe("bevestigd");
  expect(normalizeMomentStatus("bevestigd")).toBe("bevestigd");
  const moments = [{ id: "1", client_id: "vip", status: "gepland" }, { id: "2", client_id: "vip", status: "bevestigd" }, { id: "3", client_id: "vip", status: "aangevraagd" }];
  expect(filterMomentStatus(moments, ["bevestigd"]).map(m => m.id)).toEqual(["1", "2"]);
  expect(filterMomentStatus(moments, ["gepland"]).map(m => m.id)).toEqual(["1", "2"]);
});
