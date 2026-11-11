// @ts-ignore bun types not installed in app tsconfig
import { describe, expect, it } from "bun:test";
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL, clientsReadyToSend, isClientVisible, hibeNext, fmtTime } from "./videos";

describe("videos", () => {
  it("statuses are in the agreed board order", () => {
    expect(VIDEO_STATUSES.map((s) => VIDEO_STATUS_LABEL[s])).toEqual([
      "Interne controle", "Feedback verwerken", "CapCut", "Mag naar klant",
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

import { phaseOf, inTab, tabForStatus, ageTone, ROW_ACTION, clientColorSlot } from "./videos";
describe("video phases", () => {
  it("groups statuses by who is at turn", () => {
    expect(phaseOf("approved_internal")).toBe("internal");
    expect(phaseOf("ready_for_client")).toBe("client");
    expect(phaseOf("approved_client")).toBe("plan");
    expect(phaseOf("archived")).toBe("done");
  });
  it("Voor mij = all Interne controle + my own Feedback verwerken", () => {
    expect(inTab({ status: "internal_review", uploader: "x" }, "mine", "me")).toBe(true);
    expect(inTab({ status: "feedback", uploader: "me" }, "mine", "me")).toBe(true);
    expect(inTab({ status: "feedback", uploader: "x" }, "mine", "me")).toBe(false);
    expect(inTab({ status: "approved_internal", uploader: "me" }, "mine", "me")).toBe(false);
  });
  it("dashboard counters open the right tab", () => {
    expect(tabForStatus("internal_review")).toBe("mine");
    expect(tabForStatus("client_review")).toBe("client");
    expect(tabForStatus("feedback")).toBe("internal");
  });
  it("age turns orange after 3 days and red after 7", () => {
    const now = Date.parse("2026-11-11T12:00:00Z");
    expect(ageTone("2026-11-09T12:00:00Z", now)).toBe("ok");
    expect(ageTone("2026-11-08T12:00:00Z", now)).toBe("warn");
    expect(ageTone("2026-11-04T12:00:00Z", now)).toBe("late");
  });
  it("Mag naar klant has no per-video button", () => {
    expect(ROW_ACTION.ready_for_client).toBeNull();
    expect(ROW_ACTION.approved_client).toBe("schedule");
  });
  it("client colour is stable", () => { expect(clientColorSlot("abc")).toBe(clientColorSlot("abc")); });
});

import { STEPS, stepNo, statusFromSlug, STEP_ACTION, worstTone } from "./videos";
describe("media management steps", () => {
  it("has six numbered steps", () => { expect(STEPS.length).toBe(6); expect(stepNo("internal_review")).toBe(1); expect(stepNo("scheduled")).toBe(6); expect(stepNo("archived")).toBe(0); });
  it("slugs round-trip", () => { expect(statusFromSlug("mag-naar-klant")).toBe("ready_for_client"); expect(statusFromSlug("x")).toBeNull(); });
  it("CapCut step asks for a final upload", () => { expect(STEP_ACTION.approved_internal?.kind).toBe("new_version"); expect(STEP_ACTION.ready_for_client).toBeUndefined(); });
  it("counter tone takes the oldest video", () => {
    const now = Date.parse("2026-11-11T12:00:00Z");
    expect(worstTone(["2026-11-11T00:00:00Z", "2026-11-03T00:00:00Z"], now)).toBe("late");
    expect(worstTone([], now)).toBe("ok");
  });
});

describe("CapCut final skips Mag naar klant", () => {
  it("no Mag naar klant step", () => expect(STEPS.includes("ready_for_client")).toBe(false));
  it("approve from CapCut goes to client", () => expect(hibeNext("approved_internal", "approve")).toBe("client_review"));
});
