// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, it } from "bun:test";
import { dashboardRange, upcomingDashboardMoments, personalFeedback, openChecklistRows } from "./dashboard-view";

const now = new Date("2026-11-25T08:40:00Z");
describe("Dashboard Vandaag and Prestaties", () => {
  it("uses a complete 7-day window without today's partial figures", () => {
    expect(dashboardRange("7d", "2026-11-25", now)).toEqual({ start: "2026-11-18", end: "2026-11-24", prevStart: "2026-11-11", prevEnd: "2026-11-17" });
  });
  it("uses the same complete end for a 30-day window", () => {
    expect(dashboardRange("30d", "2026-11-25", now).end).toBe("2026-11-24");
    expect(dashboardRange("30d", "2026-11-25", now).start).toBe("2026-10-26");
  });
  it("does not pretend missing sync days contain figures", () => {
    expect(dashboardRange("7d", "2026-11-22", now).end).toBe("2026-11-22");
  });
  it("shows one featured moment plus at most three compact moments, earliest first", () => {
    const moments = [30, 29, 28, 27, 26].map((day) => ({ id: String(day), client_id: "client", title: "Shoot", date: `2026-11-${day}`, start_time: "10:00", status: "bevestigd" }));
    expect(upcomingDashboardMoments(moments, now).map((m) => m.id)).toEqual(["26", "27", "28", "29"]);
  });
  it("excludes past and cancelled content moments", () => {
    const moment = { id: "m", client_id: "c", title: "Shoot", date: "2026-11-25", start_time: "08:00", status: "bevestigd" };
    expect(upcomingDashboardMoments([moment, { ...moment, date: "2026-11-26", status: "geannuleerd" }], now)).toEqual([]);
  });
  it("Mijn dag only shows feedback assigned to the signed-in editor", () => {
    const own = { id: "own", status: "feedback", editor_id: "bram" };
    expect(personalFeedback([own, { ...own, id: "other", editor_id: "nick" }, { ...own, status: "internal_review" }], "bram")).toEqual([own]);
  });
  it("the checklist only includes unmet targets or genuinely pending items", () => {
    const target = { id: "target", done: 1, target: 3, cells: [{ status: "scheduled" }] };
    const pending = { id: "pending", done: 0, target: 0, cells: [{ status: "internal_check" }] };
    expect(openChecklistRows([target, pending, { id: "done", done: 3, target: 3, cells: [{ status: "scheduled" }] }, { id: "empty", done: 0, target: 0, cells: [{ status: "none" }] }]).map((r) => r.id)).toEqual(["target", "pending"]);
  });
});