import { describe, it, expect } from "bun:test";
import { trashCutoff, trashExpired, purgeFilesBeforeItem } from "./retention";

describe("trash retention", () => {
  it("removes only items strictly older than one calendar month since trashing", () => {
    const cutoff = trashCutoff(new Date("2026-11-25T08:49:00Z"));
    expect(cutoff).toBe("2026-10-25T08:49:00.000Z");
    expect(trashExpired("2026-10-25T08:48:59Z", cutoff)).toBe(true);
    expect(trashExpired("2026-10-25T08:49:00Z", cutoff)).toBe(false);
    expect(trashExpired("2026-11-24T00:00:00Z", cutoff)).toBe(false);
    expect(trashExpired(null, cutoff)).toBe(false);
  });
  it("clamps month ends and handles leap years and January", () => {
    expect(trashCutoff(new Date("2026-03-31T12:00:00Z"))).toBe("2026-02-28T12:00:00.000Z");
    expect(trashCutoff(new Date("2024-03-31T12:00:00Z"))).toBe("2024-02-29T12:00:00.000Z");
    expect(trashCutoff(new Date("2026-01-25T08:49:00Z"))).toBe("2025-12-25T08:49:00.000Z");
  });
  it("removes every version before removing the item", async () => {
    const calls: string[] = [];
    await purgeFilesBeforeItem(["v1", "v2"], async v => { calls.push(v); }, async () => { calls.push("item"); });
    expect(calls).toEqual(["v1", "v2", "item"]);
  });
  it("keeps the item for retry when a file cannot be deleted", async () => {
    let removed = false;
    await expect(purgeFilesBeforeItem(["v1"], async () => { throw new Error("offline"); }, async () => { removed = true; })).rejects.toThrow("offline");
    expect(removed).toBe(false);
  });
});