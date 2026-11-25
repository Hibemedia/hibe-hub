// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, it } from "bun:test";
import { filterMedia, type MediaFilters } from "./media-overview";

const items = [
  { id: "script-final", client_id: "dht", uploader: "nick", title: "Avond shoot", file_name: "DHT_final.mp4", status: "client_review" as const },
  { id: "capcut", client_id: "dht", uploader: "bram", title: "Nieuwe collectie", file_name: "collectie.mp4", status: "approved_internal" as const },
  { id: "other-client", client_id: "nancy", uploader: "nick", title: "Portret", file_name: "portret.mp4", status: "client_review" as const },
];
const all: MediaFilters = { client: "all", uploader: "all", q: "", phase: "all" };

describe("Media overview filters", () => {
  it("the running total opens running files, not scheduled files", () => {
    const scheduled = { ...items[0], id: "scheduled", status: "scheduled" as const };
    expect(filterMedia([...items, scheduled], { ...all, phase: "running" }).map((i) => i.id)).toEqual(["script-final", "capcut", "other-client"]);
  });
  it("a phase card selects only that phase's files", () => {
    expect(filterMedia(items, { ...all, phase: "approved_internal" }).map((i) => i.id)).toEqual(["capcut"]);
  });
  it("a Per klant count selects both the client and the phase", () => {
    expect(filterMedia(items, { ...all, client: "dht", phase: "client_review" }).map((i) => i.id)).toEqual(["script-final"]);
  });
  it("the uploader filter only keeps files uploaded by that person", () => {
    expect(filterMedia(items, { ...all, uploader: "nick" }).map((i) => i.id)).toEqual(["script-final", "other-client"]);
  });
  it("search matches filenames, ignoring case and surrounding spaces", () => {
    expect(filterMedia(items, { ...all, q: " DHT_FINAL " }).map((i) => i.id)).toEqual(["script-final"]);
  });
  it("combines search, client, phase and uploader without changing the source", () => {
    expect(filterMedia(items, { client: "dht", phase: "client_review", uploader: "bram", q: "avond" })).toEqual([]);
    expect(items[0].status).toBe("client_review");
  });
});