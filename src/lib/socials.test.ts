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
});
