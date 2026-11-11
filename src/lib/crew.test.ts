// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { crewConflicts, needsCrew, shootDaysOf } from "./crew";

const ms = [
  { id: "a", date: "2026-11-20", type: "shoot", status: "gepland" },
  { id: "b", date: "2026-11-20", type: "shoot", status: "gepland" },
  { id: "c", date: "2026-11-20", type: "shoot", status: "geannuleerd" },
  { id: "d", date: "2026-11-01", type: "shoot", status: "afgerond" },
];
const crew = [{ moment_id: "b", user_id: "nick", role: null }, { moment_id: "c", user_id: "nick", role: null }, { moment_id: "d", user_id: "nick", role: null }];

describe("crew", () => {
  test("warns when the person is already on another shoot that day", () => {
    expect(crewConflicts("nick", ms[0], ms, crew).map((m) => m.id)).toEqual(["b"]);
    expect(crewConflicts("jeroen", ms[0], ms, crew)).toEqual([]);
  });
  test("shoot without crew needs the orange label", () => {
    expect(needsCrew(ms[0], 0)).toBe(true);
    expect(needsCrew(ms[0], 1)).toBe(false);
    expect(needsCrew({ ...ms[0], type: "post" }, 0)).toBe(false);
  });
  test("Draaidagen van shows only upcoming days of that person", () => {
    expect(shootDaysOf("nick", ms, crew, "2026-11-11").map((m) => m.id)).toEqual(["b", "c"]);
  });
});
