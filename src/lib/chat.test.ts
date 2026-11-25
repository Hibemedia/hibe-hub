// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { extractMentions, fileError, fileNameOf, isImagePath, isSendKey, roomTitle } from "./chat";

const team = [{ id: "j", name: "Jeroen Beijer", avatar_url: null }, { id: "n", name: "nick", avatar_url: null }];
describe("chat", () => {
  test("@naam mentions the matching team member", () => {
    expect(extractMentions("Hoi @Nick, kijk even", team)).toEqual(["n"]);
    expect(extractMentions("@jeroen en @nick", team)).toEqual(["j", "n"]);
    expect(extractMentions("mail nick@hibe.nl", team)).toEqual([]);
  });
  test("images up to 10 MB are allowed", () => {
    expect(fileError({ type: "application/pdf", size: 50 * 1024 * 1024 })).toBeNull();
    expect(fileError({ type: "application/pdf", size: 50 * 1024 * 1024 + 1 })).not.toBeNull();
    expect(isImagePath("r/x-foto.JPG")).toBe(true);
    expect(isImagePath("r/x-offerte.pdf")).toBe(false);
    expect(fileNameOf("room/123e4567-e89b-12d3-a456-426614174000-offerte.pdf")).toBe("offerte.pdf");
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
