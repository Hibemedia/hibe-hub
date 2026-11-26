// @ts-ignore project tests run with Bun
import { describe, it, expect } from "bun:test";
import { waitTone, waitDays, trashDaysLeft, clientGroupName, sortTrash, sortNewestFirst, sortArchived, archivedAt } from "./workflow";
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
  it("puts the newest trashed video on top and the oldest at the bottom", () => {
    const items = [
      { id: "oud", trashed_at: "2026-10-16T10:00:00Z" },
      { id: "nieuw", trashed_at: "2026-11-25T10:00:00Z" },
      { id: "midden", trashed_at: "2026-11-20T10:00:00Z" },
    ];
    expect(sortTrash(items).map((i) => i.id)).toEqual(["nieuw", "midden", "oud"]);
    expect(items.map((i) => i.id)).toEqual(["oud", "nieuw", "midden"]);
    expect(sortTrash([{ id: "geen", trashed_at: null }]).map((i) => i.id)).toEqual(["geen"]);
  });
  it("puts the newest scheduled video on top and the oldest at the bottom", () => {
    const items = [
      { id: "oud", status_changed_at: "2026-11-16T14:22:00Z" },
      { id: "nieuw", status_changed_at: "2026-11-24T15:39:00Z" },
      { id: "midden", status_changed_at: "2026-11-23T13:47:00Z" },
    ];
    expect(sortNewestFirst(items).map((i) => i.id)).toEqual(["nieuw", "midden", "oud"]);
    expect(items.map((i) => i.id)).toEqual(["oud", "nieuw", "midden"]);
  });
  it("sorts the archive by archive date, newest on top", () => {
    const items = [
      { id: "oud", archived_at: "2026-09-02T10:00:00Z", status_changed_at: "2026-11-20T10:00:00Z" },
      { id: "nieuw", archived_at: "2026-11-25T10:00:00Z", status_changed_at: "2026-10-01T10:00:00Z" },
      { id: "midden", archived_at: "2026-10-18T10:00:00Z", status_changed_at: "2026-11-30T10:00:00Z" },
    ];
    expect(sortArchived(items).map((i) => i.id)).toEqual(["nieuw", "midden", "oud"]);
    expect(items.map((i) => i.id)).toEqual(["oud", "nieuw", "midden"]);
  });
  it("falls back to the step stamp when a video has no archive stamp", () => {
    expect(archivedAt({ archived_at: null, status_changed_at: "2026-11-05T08:00:00Z" })).toBe("2026-11-05T08:00:00Z");
    const items = [
      { id: "zonder", archived_at: null, status_changed_at: "2026-11-28T10:00:00Z" },
      { id: "met", archived_at: "2026-11-20T10:00:00Z", status_changed_at: "2026-01-01T10:00:00Z" },
    ];
    expect(sortArchived(items).map((i) => i.id)).toEqual(["zonder", "met"]);
  });
  it("orders videos archived in one batch by their own step stamp", () => {
    const same = "2026-11-26T09:31:25Z";
    const items = [
      { id: "later", archived_at: same, status_changed_at: "2026-11-24T15:32:00Z" },
      { id: "eerder", archived_at: same, status_changed_at: "2026-11-16T14:22:00Z" },
      { id: "midden", archived_at: same, status_changed_at: "2026-11-20T11:14:00Z" },
    ];
    expect(sortArchived(items).map((i) => i.id)).toEqual(["later", "midden", "eerder"]);
  });
});