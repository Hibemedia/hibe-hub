// @ts-ignore
import { describe, it, expect } from "bun:test";
import { canAssignTo, groupByPerson, isOverdue, sortTasks } from "./tasks";

const t = (o: any) => ({ due_date: null, due_time: null, done_at: null, created_at: "2026-01-01", assignee_id: "a", ...o });
describe("tasks", () => {
  it("editors and beheerders can select other team members for assignment", () => {
    expect(canAssignTo("editor", "me", "me")).toBe(true);
    expect(canAssignTo("editor", "me", "nick")).toBe(true);
    expect(canAssignTo("beheerder", "me", "nick")).toBe(true);
  });
  it("overdue only when open and past due", () => {
    expect(isOverdue(t({ due_date: "2026-11-10" }), "2026-11-11")).toBe(true);
    expect(isOverdue(t({ due_date: "2026-11-10", done_at: "x" }), "2026-11-11")).toBe(false);
    expect(isOverdue(t({ due_date: "2026-11-11" }), "2026-11-11")).toBe(false);
  });
  it("open first by date, undated after, done last", () => {
    const s = sortTasks([t({ id: 1, done_at: "2026" }), t({ id: 2 }), t({ id: 3, due_date: "2026-11-12" }), t({ id: 4, due_date: "2026-11-11" })]);
    expect(s.map((x: any) => x.id)).toEqual([4, 3, 2, 1]);
  });
  it("groups per person", () => {
    const g = groupByPerson([t({ assignee_id: "b" }), t({ assignee_id: "a" }), t({ assignee_id: "z" })], ["a", "b", "c"]);
    expect(g.map((x) => x.person)).toEqual(["a", "b", "z"]);
  });
});
