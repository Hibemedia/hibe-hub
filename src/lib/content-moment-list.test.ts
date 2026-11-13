// @ts-ignore bun provides its own test types
import { it, expect } from "bun:test";
import { crewOverflow, filterMomentStatus, momentReferenceImage, momentStatus, amsterdamToday } from "./content-moment-list";
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