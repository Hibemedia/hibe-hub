// @ts-ignore project tests run with Bun
import { describe, expect, it } from "bun:test";
import { splitScripts } from "./scripts-split";
describe("splitScripts", () => {
  it("splits on numbered script headings", () => {
    const r = splitScripts("Intro\nScript 1: Opening\nTekst een\nScript 2 - Tour\nTekst twee\nmeer");
    expect(r).toEqual([{ title: "Opening", body: "Tekst een" }, { title: "Tour", body: "Tekst twee\nmeer" }]);
  });
  it("keeps text without headings as one script", () => {
    expect(splitScripts("Alleen tekst", "Draaidag")).toEqual([{ title: "Draaidag", body: "Alleen tekst" }]);
  });
});
