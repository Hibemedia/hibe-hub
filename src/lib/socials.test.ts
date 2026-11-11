// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, it } from "bun:test";
import { mondayOf, ymd, statusOf } from "./socials";
describe("socials", () => {
  it("monday of a sunday is the previous monday", () => expect(ymd(mondayOf(new Date(2026, 10, 15)))).toBe("2026-11-09"));
  it("monday of a monday is itself", () => expect(ymd(mondayOf(new Date(2026, 10, 9)))).toBe("2026-11-09"));
  it("scheduled shows X", () => expect(statusOf("scheduled").symbol).toBe("X"));
});
