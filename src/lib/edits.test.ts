import { describe, expect, test } from "bun:test";
import { parseTitles, statusAfterAssign, filterEdits, progressLabel, type Edit } from "./edits";

const e = (p: Partial<Edit>): Edit => ({ id: "x", client_id: "c1", title: "t", editor_id: null, status: "assign", deadline: null, notes: null, video_item_id: null, created_at: "", ...p });
const F = { client: "all", editor: "all", status: "all", mine: false, showDelivered: false };

describe("edits", () => {
  test("each pasted line becomes one title, blanks skipped", () => {
    expect(parseTitles("Reel 1\n\n  Reel 2 \r\nReel 3\n")).toEqual(["Reel 1", "Reel 2", "Reel 3"]);
  });
  test("assigning an editor on 'Editor aanwijzen' moves to To-do", () => {
    expect(statusAfterAssign("assign", "u1")).toBe("todo");
    expect(statusAfterAssign("editing", "u1")).toBe("editing");
    expect(statusAfterAssign("assign", null)).toBe("assign");
  });
  test("delivered edits are hidden unless 'Toon ingeleverd' is on", () => {
    const list = [e({ id: "a" }), e({ id: "b", status: "delivered" })];
    expect(filterEdits(list, F, null).map((x) => x.id)).toEqual(["a"]);
    expect(filterEdits(list, { ...F, showDelivered: true }, null).map((x) => x.id)).toEqual(["a", "b"]);
  });
  test("'Alleen mijn edits' keeps only my edits", () => {
    const list = [e({ id: "a", editor_id: "me" }), e({ id: "b", editor_id: "other" })];
    expect(filterEdits(list, { ...F, mine: true }, "me").map((x) => x.id)).toEqual(["a"]);
  });
  test("progress counts delivered of total", () => {
    expect(progressLabel([e({ status: "delivered" }), e({}), e({})])).toBe("1 van 3 ingeleverd");
  });
});
