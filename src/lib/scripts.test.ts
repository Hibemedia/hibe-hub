import { describe, expect, test } from "bun:test";
import { filterScripts, type Script } from "./scripts";
const s = (id: string, client_id: string, title: string, body: string, created_at: string): Script => ({ id, client_id, title, body, link: null, moment_id: null, shared_with_client: false, created_at, updated_at: created_at });
const list = [s("1", "a", "Hook zomer", "strand", "2026-01-01"), s("2", "b", "Winter", "Sneeuw hook", "2026-02-01")];
describe("filterScripts", () => {
  test("zoekt in titel én tekst", () => expect(filterScripts(list, "hook", "all").map((x) => x.id)).toEqual(["2", "1"]));
  test("filtert op klant", () => expect(filterScripts(list, "", "a").map((x) => x.id)).toEqual(["1"]));
});
