// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { extractMentions, imageError, isSendKey, roomTitle } from "./chat";

const team = [{ id: "j", name: "Jeroen Beijer", avatar_url: null }, { id: "n", name: "nick", avatar_url: null }];
describe("chat", () => {
  test("@naam mentions the matching team member", () => {
    expect(extractMentions("Hoi @Nick, kijk even", team)).toEqual(["n"]);
    expect(extractMentions("@jeroen en @nick", team)).toEqual(["j", "n"]);
    expect(extractMentions("mail nick@hibe.nl", team)).toEqual([]);
  });
  test("images up to 10 MB are allowed", () => {
    expect(imageError({ type: "image/png", size: 10 * 1024 * 1024 })).toBeNull();
    expect(imageError({ type: "image/png", size: 10 * 1024 * 1024 + 1 })).not.toBeNull();
    expect(imageError({ type: "application/pdf", size: 10 })).not.toBeNull();
  });
  test("Enter sends, Shift+Enter does not", () => {
    expect(isSendKey({ key: "Enter", shiftKey: false })).toBe(true);
    expect(isSendKey({ key: "Enter", shiftKey: true })).toBe(false);
  });
  test("a DM is titled after the other person", () => {
    expect(roomTitle({ kind: "dm", name: null }, [team[1]])).toBe("nick");
    expect(roomTitle({ kind: "channel", name: "Montage" }, [])).toBe("Montage");
  });
});
