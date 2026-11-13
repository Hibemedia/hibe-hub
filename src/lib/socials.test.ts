// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, it } from "bun:test";
import { mondayOf, weekDates, ymd, statusOf, socialPreviewRows, type SClient, type Post, type Week, type SocialVideoLink } from "./socials";
describe("socials", () => {
  it("monday of a sunday is the previous monday", () => expect(ymd(mondayOf(new Date(2026, 10, 15)))).toBe("2026-11-09"));
  it("monday of a monday is itself", () => expect(ymd(mondayOf(new Date(2026, 10, 9)))).toBe("2026-11-09"));
  it("scheduled shows X", () => expect(statusOf("scheduled").symbol).toBe("X"));
  it("weekDates runs Monday to Sunday", () => {
    const d = weekDates(new Date(2026, 10, 11));
    expect(d).toHaveLength(7);
    expect(d[0]).toBe("2026-11-09");
    expect(d[6]).toBe("2026-11-15");
  });
  it("weekDates on a sunday gives that same week", () => {
    const d = weekDates(new Date(2026, 10, 15));
    expect(d[0]).toBe("2026-11-09");
    expect(d[6]).toBe("2026-11-15");
  });
});
