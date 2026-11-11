// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, test } from "bun:test";
import { avatarSlot, initials, avatarFileError } from "./avatar";

describe("avatar", () => {
  test("same person always gets the same colour slot", () => {
    expect(avatarSlot("abc")).toBe(avatarSlot("abc"));
    expect(avatarSlot("abc")).toBeGreaterThanOrEqual(1);
    expect(avatarSlot("abc")).toBeLessThanOrEqual(8);
  });
  test("initials", () => {
    expect(initials("Jeroen Beijer")).toBe("JB");
    expect(initials("nick@hibemedia.com")).toBe("NH");
  });
  test("only JPG/PNG up to 5 MB", () => {
    expect(avatarFileError({ type: "image/png", size: 5 * 1024 * 1024 })).toBeNull();
    expect(avatarFileError({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).not.toBeNull();
    expect(avatarFileError({ type: "image/gif", size: 10 })).not.toBeNull();
  });
});
