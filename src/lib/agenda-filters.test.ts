// @ts-ignore bun types are provided by the test runner
import { describe, it, expect } from "bun:test";
import { agendaDayPreview, defaultAgendaFilters, filterAgendaEntries, readAgendaFilters, writeAgendaFilters } from "./agenda-filters";
import type { AgendaEntry } from "./agenda";

const items: AgendaEntry[] = [
  { id: "shoot", kind: "shoot", title: "Shoot", start: "2026-11-13", end: "2026-11-13", people: ["me", "nick"], clientId: "vip" },
  { id: "edit", kind: "edit", title: "Montage", start: "2026-11-13", end: "2026-11-13", people: ["nick"], clientId: "vip" },
  { id: "task", kind: "task", title: "Script", start: "2026-11-13", end: "2026-11-13", people: ["mariese"], clientId: "glu" },
  { id: "meeting", kind: "meeting", title: "Meeting", start: "2026-11-13", end: "2026-11-13", people: ["me"] },
];
describe("shared HIBE agenda filters", () => {
  it("Alleen ik includes assigned items only", () => {
    expect(filterAgendaEntries(items, { ...defaultAgendaFilters(), who: "me" }, "me").map((e) => e.id)).toEqual(["shoot", "meeting"]);
  });
  it("Team supports multiple members without duplicate items", () => {
    expect(filterAgendaEntries(items, { ...defaultAgendaFilters(), who: "team", people: ["me", "nick"] }, "me").map((e) => e.id)).toEqual(["shoot", "edit", "meeting"]);
  });
  it("multiple types can be enabled, disabled and reset to Alles", () => {
    expect(filterAgendaEntries(items, { ...defaultAgendaFilters(), kinds: ["shoot", "edit"] }, "me").map((e) => e.id)).toEqual(["shoot", "edit"]);
    expect(filterAgendaEntries(items, { ...defaultAgendaFilters(), kinds: [] }, "me")).toEqual([]);
    expect(filterAgendaEntries(items, defaultAgendaFilters(), "me")).toHaveLength(4);
  });
  it("multiple clients combine with person and type filters", () => {
    expect(filterAgendaEntries(items, { ...defaultAgendaFilters(), clients: ["vip", "glu"] }, "me").map((e) => e.id)).toEqual(["shoot", "edit", "task"]);
    expect(filterAgendaEntries(items, { who: "team", people: ["nick"], kinds: ["edit"], clients: ["vip", "glu"] }, "me").map((e) => e.id)).toEqual(["edit"]);
  });
  it("reads the requested Dutch URL values", () => {
    expect(readAgendaFilters(new URLSearchParams("wie=ik&type=draaidag"))).toEqual({ who: "me", people: [], kinds: ["shoot"], clients: [] });
  });
  it("round trips multiselect and empty type selections while preserving unrelated params", () => {
    const f = { ...defaultAgendaFilters(), who: "team" as const, people: ["nick", "me"], clients: ["vip", "glu"], kinds: [] };
    const p = writeAgendaFilters(f, new URLSearchParams("other=keep"));
    expect(readAgendaFilters(p)).toEqual(f);
    expect(p.get("other")).toBe("keep");
  });
  it("three items show one plus two more; two remain visible", () => {
    expect(agendaDayPreview(items.slice(0, 3))).toEqual({ visible: [items[0]], more: 2 });
    expect(agendaDayPreview(items.slice(0, 2)).more).toBe(0);
    expect(agendaDayPreview(items.slice(0, 2)).visible).toHaveLength(2);
  });
});