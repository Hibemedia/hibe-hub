// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, it } from "bun:test";
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL, clientsReadyToSend, isClientVisible, hibeNext, fmtTime } from "./videos";

describe("videos", () => {
  it("statuses are in the agreed board order", () => {
    expect(VIDEO_STATUSES.map((s) => VIDEO_STATUS_LABEL[s])).toEqual([
      "Interne controle", "Feedback verwerken", "Goedgekeurd (intern)", "Mag naar klant",
      "Ter controle bij klant", "Goedgekeurd (klant)", "Ingepland", "Archief",
    ]);
  });
  it("client sees nothing before 'Ter controle bij klant'", () => {
    expect(isClientVisible("ready_for_client")).toBe(false);
    expect(isClientVisible("internal_review")).toBe(false);
    expect(isClientVisible("client_review")).toBe(true);
    expect(isClientVisible("archived")).toBe(true);
  });
  it("notice appears at 3 ready videos for one client, not at 2", () => {
    const r = (c: string) => ({ client_id: c, status: "ready_for_client" as const });
    expect(clientsReadyToSend([r("a"), r("a"), r("b")])).toEqual([]);
    expect(clientsReadyToSend([r("a"), r("a"), r("a"), r("b")])).toEqual([{ client_id: "a", count: 3 }]);
  });
  it("other statuses don't count toward the notice", () => {
    expect(clientsReadyToSend([{ client_id: "a", status: "client_review" }, { client_id: "a", status: "ready_for_client" }, { client_id: "a", status: "ready_for_client" }])).toEqual([]);
  });
  it("HIBE approve from internal check goes to Goedgekeurd (intern)", () => expect(hibeNext("internal_review", "approve")).toBe("approved_internal"));
  it("feedback always goes to Feedback verwerken", () => expect(hibeNext("client_review", "feedback")).toBe("feedback"));
  it("formats timecodes", () => { expect(fmtTime(65.7)).toBe("1:05"); expect(fmtTime(3725)).toBe("1:02:05"); });
});
