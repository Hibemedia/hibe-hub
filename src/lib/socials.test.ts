// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, it } from "bun:test";
import { mondayOf, weekDates, monthWeeks, isoWeek, ymd, statusOf, socialPreviewRows, filterPickableVideos, type SClient, type Post, type Week, type SocialVideoLink } from "./socials";
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

  it("monthWeeks runs whole weeks, never a cut week", () => {
    const w = monthWeeks(new Date(2026, 10, 1)); // november 2026: 1st is a sunday, 30th a monday
    expect(w.map((x) => x.start)).toEqual(["2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]);
    expect(w[0].dates[0]).toBe("2026-10-26");
    expect(w[0].dates[6]).toBe("2026-11-01");
    expect(w[w.length - 1].end).toBe("2026-12-06");
    expect(w.every((x) => x.dates.length === 7 && ymd(mondayOf(new Date(x.start + "T00:00:00"))) === x.start)).toBe(true);
  });
  it("monthWeeks keeps a month that starts and ends mid-week whole", () => {
    const w = monthWeeks(new Date(2026, 9, 1)); // oktober 2026: 1st thursday, 31st saturday
    expect(w[0].start).toBe("2026-09-28");
    expect(w[w.length - 1].end).toBe("2026-11-01");
    expect(w.every((x) => x.dates[0] < x.dates[6])).toBe(true);
  });
  it("isoWeek numbers weeks Monday-based and equal for the whole week", () => {
    expect(isoWeek(new Date(2026, 10, 9))).toBe(46);
    expect(isoWeek(new Date(2026, 10, 15))).toBe(46);
    expect(isoWeek(new Date(2026, 10, 16))).toBe(47);
    expect(isoWeek(new Date(2026, 0, 1))).toBe(isoWeek(new Date(2026, 0, 4)));
  });

  const D = weekDates(new Date(2026, 10, 11)); // 2026-11-09 .. 2026-11-15
  const sc = (id: string, name: string, mode = "daily", weekly_target = 0): SClient =>
    ({ id, name, abbreviation: name, category: "", is_active: true, tracking_mode: mode, weekly_target });
  const post = (client_id: string, post_date: string, status: string): Post =>
    ({ client_id, post_date, status: status as Post["status"], note: null, title: null });

  it("preview puts open clients first, caps the list and totals all clients", () => {
    const clients = [sc("a", "Appelboom"), sc("b", "Bloom"), sc("c", "Cedar", "weekly", 2)];
    const posts = [post("a", D[0], "scheduled"), post("a", D[1], "to_post"), post("b", D[0], "scheduled"), post("b", D[1], "scheduled")];
    const weeks: Week[] = [{ client_id: "c", week_start: D[0], count: 0, items: [
      { id: "1", title: "Reel 1", status: "scheduled", note: "" },
      { id: "2", title: "Reel 2", status: "in_progress", note: "" },
    ] }];
    const r = socialPreviewRows(clients, posts, weeks, [], [], D, D[0], 2);
    expect(r.rows.map((x) => x.name)).toEqual(["Appelboom", "Cedar"]);
    expect(r.hidden).toBe(1);
    expect(r.done).toBe(4);
    expect(r.planned).toBe(6);
    expect(r.rows[1].done).toBe(1);
    expect(r.rows[1].target).toBe(2);
  });

  it("preview pads weekly slots to the target", () => {
    const clients = [sc("c", "Cedar", "weekly", 3)];
    const weeks: Week[] = [{ client_id: "c", week_start: D[0], count: 0, items: [{ id: "1", title: "Reel 1", status: "scheduled", note: "" }] }];
    const r = socialPreviewRows(clients, [], weeks, [], [], D, D[0], 6);
    expect(r.rows[0].cells.map((x) => x.status)).toEqual(["scheduled", "none", "none"]);
    expect(r.rows[0].done).toBe(1);
    expect(r.rows[0].target).toBe(3);
    expect(r.rows[0].open).toBe(true);
  });

  it("preview follows a linked video's status", () => {
    const clients = [sc("a", "Appelboom")];
    const posts = [post("a", D[0], "scheduled")];
    const links: SocialVideoLink[] = [{ id: "l1", social_client_id: "a", post_date: D[1], video_item_id: "v1" }];
    const r = socialPreviewRows(clients, posts, [], links, [{ id: "v1", status: "scheduled" }], D, D[0], 6);
    expect(r.rows[0].cells[1].status).toBe("scheduled");
    expect(r.rows[0].cells[1].linked).toBe(true);
    expect(r.rows[0].done).toBe(2);
    expect(r.rows[0].target).toBe(2);
    expect(r.rows[0].open).toBe(false);
  });

  const vid = (id: string, client_id: string, title: string, status = "approved_client") =>
    ({ id, client_id, title, status });
  const names = (id: string) => ({ a: "Appelboom", b: "Banaan" } as Record<string, string>)[id] ?? "Klant";

  it("video picker hides archived videos", () => {
    const list = filterPickableVideos([vid("v1", "a", "Reel"), vid("v2", "a", "Oude take", "archived")], "", names);
    expect(list.map((v) => v.id)).toEqual(["v1"]);
  });
  it("video picker searches title and client name", () => {
    const all = [vid("v1", "a", "Behind the scenes"), vid("v2", "b", "Kitchen loop"), vid("v3", "b", "Interview")];
    expect(filterPickableVideos(all, "kitch", names).map((v) => v.id)).toEqual(["v2"]);
    expect(filterPickableVideos(all, "bana", names).map((v) => v.id)).toEqual(["v2", "v3"]);
  });
  it("video picker can limit to one client", () => {
    const all = [vid("v1", "a", "Reel"), vid("v2", "b", "Loop")];
    expect(filterPickableVideos(all, "", names, "Banaan").map((v) => v.id)).toEqual(["v2"]);
    expect(filterPickableVideos(all, "reel", names, "Banaan")).toEqual([]);
    expect(filterPickableVideos(all, "", names, "banaan ").map((v) => v.id)).toEqual(["v2"]);
  });
});
