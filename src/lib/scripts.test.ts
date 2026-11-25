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
