import { expect, test } from "bun:test";
import { buildIcs, escapeText, feedScope, fold, type IcsEvent } from "./ics.ts";

const stamp = "2026-01-19T10:00:00.000Z";

test("a vacation spans its days and does not block busy time", () => {
  const ics = buildIcs(
    [{ uid: "hibe-vacation-1@hibespace.com", title: "Jeroen · Vakantie", start: "2026-12-21", end: "2026-12-31", transparent: true, category: "Vrij" }],
    { name: "HIBE", stamp },
  );
  expect(ics).toContain("DTSTART;VALUE=DATE:20261221");
  // iCal ends all-day events exclusively: the day after the last holiday.
  expect(ics).toContain("DTEND;VALUE=DATE:20270101");
  expect(ics).toContain("TRANSP:TRANSPARENT");
  expect(ics).toContain("CATEGORIES:Vrij");
});

test("a meeting keeps its own times in Amsterdam time", () => {
  const ics = buildIcs(
    [{ uid: "hibe-meeting-1@hibespace.com", title: "Weekstart", start: "2026-03-25", end: "2026-03-25", startTime: "10:00", endTime: "11:30", location: "Studio" }],
    { name: "HIBE", stamp },
  );
  expect(ics).toContain("DTSTART;TZID=Europe/Amsterdam:20260325T100000");
  expect(ics).toContain("DTEND;TZID=Europe/Amsterdam:20260325T113000");
  expect(ics).toContain("LOCATION:Studio");
  expect(ics).toContain("TRANSP:OPAQUE");
});

test("a timed item without an end time lasts one hour", () => {
  const ics = buildIcs([{ uid: "u@h", title: "Taak", start: "2026-06-02", startTime: "09:15" }], { name: "HIBE", stamp });
  expect(ics).toContain("DTSTART;TZID=Europe/Amsterdam:20260602T091500");
  expect(ics).toContain("DTEND;TZID=Europe/Amsterdam:20260602T101500");
});

test("a late end time that runs past midnight ends the next day", () => {
  const ics = buildIcs([{ uid: "u@h", title: "Late shoot", start: "2026-09-30", startTime: "23:30", endTime: "00:30" }], { name: "HIBE", stamp });
  expect(ics).toContain("DTEND;TZID=Europe/Amsterdam:20261001T003000");
});

test("a multi-day moment with a time is still shown all day", () => {
  const ics = buildIcs([{ uid: "u@h", title: "Draaidag", start: "2026-05-04", end: "2026-05-06", startTime: "08:00" }], { name: "HIBE", stamp });
  expect(ics).toContain("DTSTART;VALUE=DATE:20260504");
  expect(ics).toContain("DTEND;VALUE=DATE:20260507");
});

test("an option moment is tentative and a confirmed one is not", () => {
  const ics = buildIcs(
    [
      { uid: "a@h", title: "In optie", start: "2026-04-01", tentative: true },
      { uid: "b@h", title: "Bevestigd", start: "2026-04-02" },
    ],
    { name: "HIBE", stamp },
  );
  expect(ics).toContain("STATUS:TENTATIVE");
  expect(ics.match(/STATUS:CONFIRMED/g)?.length).toBe(1);
});

test("commas, semicolons and newlines in text are escaped", () => {
  expect(escapeText("Klant, studio; kantoor\n2e etage")).toBe("Klant\\, studio\\; kantoor\\n2e etage");
  const ics = buildIcs([{ uid: "u@h", title: "Shoot, edit; final", start: "2026-04-01" }], { name: "HIBE", stamp });
  expect(ics).toContain("SUMMARY:Shoot\\, edit\\; final");
});

test("every line stays under 75 octets and the file uses CRLF", () => {
  const long = "Ruleerlang".repeat(30);
  const ics = buildIcs([{ uid: "u@h", title: "Draaidag", start: "2026-04-01", description: long }], { name: "HIBE", stamp });
  const lines = ics.split("\r\n");
  expect(ics).toContain("\r\n");
  for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  // A folded description must come back as one unbroken value.
  const joined = ics.replace(/\r\n /g, "");
  expect(joined).toContain(`DESCRIPTION:${long.replace(/[\\;,]/g, (c) => `\\${c}`)}`);
});

test("folding keeps multi-byte characters whole", () => {
  const folded = fold(`DESCRIPTION:${"é".repeat(100)}`);
  for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  expect(folded.replace(/\r\n /g, "")).toBe(`DESCRIPTION:${"é".repeat(100)}`);
});

test("the calendar is named, timed to Amsterdam and refreshes hourly", () => {
  const ics = buildIcs([], { name: "HIBE Agenda · Jeroen", stamp });
  expect(ics).toContain("X-WR-CALNAME:HIBE Agenda \\· Jeroen".replace("\\·", "·"));
  expect(ics).toContain("X-WR-TIMEZONE:Europe/Amsterdam");
  expect(ics).toContain("X-PUBLISHED-TTL:PT1H");
  expect(ics).toContain("TZID:Europe/Amsterdam");
  expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
  expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
});

test("the same event always produces the same record", () => {
  const ev: IcsEvent = { uid: "hibe-shoot-9@hibespace.com", title: "Jebroer · Najaar", start: "2026-04-08", startTime: "09:00" };
  expect(buildIcs([ev], { name: "HIBE", stamp })).toBe(buildIcs([ev], { name: "HIBE", stamp }));
});

test("a team feed needs the admin role, otherwise it stays personal", () => {
  expect(feedScope("team", true)).toBe("team");
  expect(feedScope("team", false)).toBe("me");
  expect(feedScope("me", true)).toBe("me");
  expect(feedScope(null, true)).toBe("me");
  expect(feedScope("iets anders", true)).toBe("me");
});
