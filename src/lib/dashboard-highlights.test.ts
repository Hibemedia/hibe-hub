// @ts-ignore bun types not installed in app tsconfig
import { expect, test } from "bun:test";
import { nextContentMoment, type HighlightMoment } from "./dashboard-highlights";

test("next content moment is the earliest upcoming active moment in Amsterdam time", () => {
  const moment = (id: string, date: string, start_time: string | null, status = "ingepland"): HighlightMoment => ({ id, date, start_time, status, title: id, client_id: "client" });
  expect(nextContentMoment([
    moment("tomorrow", "2026-11-14", "09:00:00"),
    moment("past", "2026-11-13", "10:00:00"),
    moment("cancelled", "2026-11-13", "10:30:00", "geannuleerd"),
    moment("next", "2026-11-13", "11:00:00"),
  ], new Date("2026-11-13T09:22:00Z"))?.id).toBe("next");
});
test("no upcoming content produces an empty state", () => {
  expect(nextContentMoment([], new Date("2026-11-13T09:22:00Z"))).toBeUndefined();
});