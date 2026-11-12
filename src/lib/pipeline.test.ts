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
