// @ts-ignore
import { describe, it, expect } from "bun:test";
import { ageTone, buildCards, daysIn } from "./pipeline";

describe("pipeline", () => {
  it("tones: under 3 days ok, 3-5 warn, over 5 late", () => {
    expect(ageTone(2)).toBe("ok"); expect(ageTone(3)).toBe("warn"); expect(ageTone(5)).toBe("warn"); expect(ageTone(6)).toBe("late");
  });
  it("counts whole days in phase", () => { expect(daysIn("2026-11-09T10:00:00Z", new Date("2026-11-12T11:00:00Z"))).toBe(3); });
  it("maps sources to phases", () => {
    const c = buildCards({
      tasks: [{ id: "1", title: "Script maken", client_id: null, assignee_id: "a", done_at: null, created_at: "x" }, { id: "2", title: "Bellen", client_id: null, assignee_id: "a", done_at: null, created_at: "x" }],
      moments: [{ id: "m", title: "Shoot", client_id: "c", type: "shoot", status: "bevestigd", date: "2026-12-01", created_at: "x" }],
      edits: [{ id: "a", title: "A", client_id: "c", editor_id: null, status: "assign", created_at: "x" }, { id: "b", title: "B", client_id: "c", editor_id: "e", status: "delivered", created_at: "x" }],
      videos: [{ id: "v", title: "V", client_id: "c", status: "client_review", current_version: 3, archived_at: null, status_changed_at: "x" }],
    }, "2026-11-12");
    expect(c.map((x) => x.phase)).toEqual(["script", "shoot", "plan", "client"]);
    expect(c[3].turn).toBe("Klant"); expect(c[3].round).toBe(2);
  });
});

describe("done column", () => {
  const base = { tasks: [], moments: [], edits: [] };
  const v = (id: string, at: string) => ({ id, title: id, client_id: "c", status: "scheduled", current_version: 1, archived_at: null, status_changed_at: at });
  it("shows scheduled videos for 7 days, then hides them", () => {
    const now = new Date("2026-11-12T12:00:00Z");
    const cards = buildCards({ ...base, videos: [v("a", "2026-11-06T13:00:00Z"), v("b", "2026-11-05T11:00:00Z")] }, "2026-11-12", now);
    expect(cards.map((c) => [c.id, c.phase])).toEqual([["va", "done"]]);
  });
});

import { deliveredThisMonth, slaTone } from "./pipeline";
describe("SLA per maand", () => {
  const now = new Date(2026, 10, 12);
  it("telt alleen ingeplande video's van deze maand", () => {
    const c = deliveredThisMonth([
      { client_id: "a", status: "scheduled", status_changed_at: new Date(2026, 10, 3).toISOString() },
      { client_id: "a", status: "scheduled", status_changed_at: new Date(2026, 9, 30).toISOString() },
      { client_id: "a", status: "client_review", status_changed_at: new Date(2026, 10, 4).toISOString() },
    ], now);
    expect(c.a).toBe(1);
  });
  it("target gehaald, op schema of achter", () => {
    expect(slaTone(8, 8, now)).toBe("met");
    expect(slaTone(3, 8, now)).toBe("ok");
    expect(slaTone(1, 8, now)).toBe("behind");
    expect(slaTone(2, null, now)).toBe("none");
  });
});
