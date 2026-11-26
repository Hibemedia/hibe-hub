// @ts-ignore project tests run with Bun
import { describe, expect, test } from "bun:test";
import { filterScripts, type Script } from "./scripts";
const s = (id: string, client_id: string, title: string, body: string, created_at: string): Script => ({ id, client_id, title, body, link: null, moment_id: null, shared_with_client: false, created_at, updated_at: created_at });
const list = [s("1", "a", "Hook zomer", "strand", "2026-01-01"), s("2", "b", "Winter", "Sneeuw hook", "2026-02-01")];
describe("filterScripts", () => {
  test("zoekt in titel én tekst", () => expect(filterScripts(list, "hook", "all").map((x) => x.id)).toEqual(["2", "1"]));
  test("filtert op klant", () => expect(filterScripts(list, "", "a").map((x) => x.id)).toEqual(["1"]));
});
import { usedScripts } from "./scripts";
test("gebruikte scripts: alleen met ingeplande dag, nieuwste dag eerst", () => {
  const l = [{ ...list[0], moment_id: "m1" }, { ...list[1], moment_id: "m2" }, s("3", "a", "x", "", "2026-03-01")];
  const r = usedScripts(l, { m1: { title: "A", date: "2026-05-01" }, m2: { title: "B", date: null } });
  expect(r.map((x) => x.script.id)).toEqual(["1"]);
});
import { groupScriptsByDay, dayBlockOpen } from "./scripts";
const withDay = (id: string, moment_id: string | null) => ({ ...s(id, "a", `t${id}`, "", "2026-01-01"), moment_id });
const base = { collapsible: true, filterActive: false, selectedMomentId: undefined };
describe("groupScriptsByDay", () => {
  test("één blok per draaidag, volgorde blijft", () => {
    const g = groupScriptsByDay([withDay("1", "m1"), withDay("2", "m2"), withDay("3", "m1")], { m1: "Shop", m2: "Studio" });
    expect(g.map((x) => x.id)).toEqual(["m1", "m2", "m1"]);
    expect(g[0].label).toBe("Shop");
    expect(g[0].list.map((x) => x.id)).toEqual(["1"]);
  });
  test("scripts zonder dag heten Zonder draaidag", () => {
    const g = groupScriptsByDay([withDay("1", null)], {});
    expect(g[0].id).toBe(null);
    expect(g[0].label).toBe("Zonder draaidag");
  });
});
describe("dayBlockOpen", () => {
  test("standaard dicht, behalve de dag van het geopende script", () => {
    expect(dayBlockOpen("m1", {}, { ...base, selectedMomentId: "m2" })).toBe(false);
    expect(dayBlockOpen("m1", {}, { ...base, selectedMomentId: "m1" })).toBe(true);
  });
  test("klikken opent en sluit", () => {
    expect(dayBlockOpen("m1", { m1: true }, base)).toBe(true);
    expect(dayBlockOpen("m1", { m1: false }, { ...base, selectedMomentId: "m1" })).toBe(false);
  });
  test("zoeken of filteren opent alles", () => {
    expect(dayBlockOpen("m1", { m1: false }, { ...base, filterActive: true })).toBe(true);
  });
  test("bij nieuwe scripts is er niets in te klappen", () => {
    expect(dayBlockOpen("m1", { m1: false }, { collapsible: false, filterActive: false, selectedMomentId: null })).toBe(true);
  });
});
