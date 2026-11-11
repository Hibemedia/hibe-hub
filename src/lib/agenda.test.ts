// @ts-ignore bun types not installed in app tsconfig
import { describe, it, expect } from "bun:test";
import { monthGrid, entriesOn, absentOn, shootRow, ymd, AgendaEntry } from "./agenda";

const list: AgendaEntry[] = [
  { id: "v", kind: "vacation", title: "Vakantie", start: "2026-11-10", end: "2026-11-14", people: ["a"] },
  { id: "m", kind: "meeting", title: "Overleg", start: "2026-11-12", end: "2026-11-12", time: "10:00", people: ["b"] },
  { id: "s", kind: "shoot", title: "Shoot", start: "2026-11-12", end: "2026-11-12", time: "09:00", people: ["c"] },
];

describe("agenda", () => {
  it("month grid starts on Monday and has 42 days", () => {
    const g = monthGrid(2026, 10); // November 2026, 1st is a Sunday
    expect(g).toHaveLength(42);
    expect(ymd(g[0])).toBe("2026-10-26");
    expect(g[0].getDay()).toBe(1);
  });
  it("multi-day vacation shows on every day in its range, ordered shoot first", () => {
    expect(entriesOn("2026-11-12", list).map((e) => e.id)).toEqual(["s", "m", "v"]);
    expect(entriesOn("2026-11-14", list).map((e) => e.id)).toEqual(["v"]);
    expect(entriesOn("2026-11-15", list)).toEqual([]);
  });
  it("absentOn lists people on vacation that day", () => {
    expect(absentOn("2026-11-11", list)).toEqual(["a"]);
    expect(absentOn("2026-11-20", list)).toEqual([]);
  });
  it("a draaidag from the agenda becomes a confirmed shoot moment", () => {
    const row = shootRow({ title: "  Shoot najaar  ", client_id: "c1", date: "2026-11-20", start_time: "09:30", location: "  ", notes: "Neem lichten mee" }, "u1");
    expect(row).toEqual({ client_id: "c1", title: "Shoot najaar", type: "shoot", date: "2026-11-20", start_time: "09:30", location: null, notes: "Neem lichten mee", status: "bevestigd", requested_by: "u1" });
    expect(shootRow({ title: "X", client_id: "c1", date: "2026-11-20", start_time: "  " }, "").start_time).toBeNull();
    expect(shootRow({ title: "X", client_id: "c1", date: "2026-11-20" }, "").requested_by).toBeNull();
  });
});
