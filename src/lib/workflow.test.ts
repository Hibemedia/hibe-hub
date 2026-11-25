// @ts-ignore project tests run with Bun
import { describe, it, expect } from "bun:test";
import { waitTone, waitDays, trashDaysLeft, clientGroupName } from "./workflow";
describe("platform rules", () => {
  it("wait is green below 3, orange at 3 through 5, red after 5", () => {
    expect([2,3,5,6].map(waitTone)).toEqual(["ok","warn","warn","late"]);
    expect(waitDays("2026-11-22T09:00:00Z", Date.parse("2026-11-25T09:00:00Z"))).toBe(3);
  });
  it("trash countdown begins at trash date and uses a calendar month", () => {
    expect(trashDaysLeft("2026-11-16T10:00:00Z", Date.parse("2026-11-25T10:00:00Z"))).toBe(21);
    expect(trashDaysLeft("2026-10-16T10:00:00Z", Date.parse("2026-11-25T10:00:00Z"))).toBe(0);
  });
  it("groups the requested channels but not unrelated customers", () => {
    expect(clientGroupName("Feer Onderdelen")).toBe("Feer");
    expect(clientGroupName("Jebroer Core")).toBe("Jebroer");
    expect(clientGroupName("Feer Events")).toBe("Feer Events");
  });
});