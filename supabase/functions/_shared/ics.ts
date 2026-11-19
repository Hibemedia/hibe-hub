// Pure iCal (.ics) building for the HIBE agenda feed: no network, no Deno APIs,
// so the agenda-ics edge function can use it and `bun test` can cover it.

export type FeedScope = "me" | "team";

/** A team feed is only for HIBE admins; anything else stays personal. */
export function feedScope(requested: string | null | undefined, isAdmin: boolean): FeedScope {
  return requested === "team" && isAdmin ? "team" : "me";
}

export type IcsEvent = {
  /** Stable identifier so a phone updates an item instead of duplicating it. */
  uid: string;
  title: string;
  /** YYYY-MM-DD, first day (inclusive). */
  start: string;
  /** YYYY-MM-DD, last day (inclusive). Defaults to start. */
  end?: string | null;
  /** HH:MM, 24h. Without it the event is all-day. */
  startTime?: string | null;
  /** HH:MM, 24h. Missing means one hour after the start. */
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  /** Moments that are "in optie" show up as tentative. */
  tentative?: boolean;
  /** Vacations must not block busy time. */
  transparent?: boolean;
  category?: string;
};

const DAY = 864e5;
const pad = (n: number) => String(n).padStart(2, "0");

function parseDay(day: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? "");
  if (!m) throw new Error(`Datum heeft het verkeerde formaat: ${day}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setUTCDate(d.getUTCDate() + n);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** YYYYMMDD */
function dateValue(day: string): string {
  const d = parseDay(day);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

/** YYYYMMDDTHHMMSS from a day plus minutes since midnight. */
function dateTimeValue(day: string, minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${dateValue(day)}T${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
}

/** Minutes since midnight of "HH:MM", or null when there is no time. */
function minutesOf(time: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(time ?? ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** When a timed event ends: its own end time, or one hour after the start. */
function endOf(ev: IcsEvent): { day: string; minutes: number } {
  const start = minutesOf(ev.startTime) ?? 0;
  const base = ev.end && ev.end > ev.start ? ev.end : ev.start;
  const end = minutesOf(ev.endTime);
  if (end === null) {
    return start + 60 >= 1440 ? { day: addDays(base, 1), minutes: start + 60 - 1440 } : { day: base, minutes: start + 60 };
  }
  return end <= start ? { day: addDays(base, 1), minutes: end } : { day: base, minutes: end };
}

export function escapeText(value: string): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 wants lines under 75 octets; longer ones fold onto a continuation line. */
export function fold(line: string): string {
  const width = (s: string) => new TextEncoder().encode(s).length;
  if (width(line) <= 75) return line;
  const out: string[] = [];
  let current = "";
  let used = 0;
  for (const ch of line) {
    const w = width(ch);
    const limit = out.length === 0 ? 75 : 74;
    if (used + w > limit) {
      out.push(current);
      current = ` ${ch}`;
      used = 1 + w;
    } else {
      current += ch;
      used += w;
    }
  }
  out.push(current);
  return out.join("\r\n");
}

function icsStamp(iso: string | null | undefined): string {
  const d = new Date(iso ?? "");
  if (Number.isNaN(d.getTime())) return "20260101T000000Z";
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Amsterdam",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function eventLines(ev: IcsEvent, stamp: string): string[] {
  const last = ev.end && ev.end > ev.start ? ev.end : ev.start;
  const timed = minutesOf(ev.startTime) !== null && last === ev.start;
  const out: string[] = ["BEGIN:VEVENT", `UID:${ev.uid}`, `DTSTAMP:${stamp}`];
  if (timed) {
    const e = endOf(ev);
    out.push(`DTSTART;TZID=Europe/Amsterdam:${dateTimeValue(ev.start, minutesOf(ev.startTime)!)}`);
    out.push(`DTEND;TZID=Europe/Amsterdam:${dateTimeValue(e.day, e.minutes)}`);
  } else {
    // All-day spans end exclusively, so the day after the last day is the end.
    out.push(`DTSTART;VALUE=DATE:${dateValue(ev.start)}`);
    out.push(`DTEND;VALUE=DATE:${dateValue(addDays(last, 1))}`);
  }
  out.push(`SUMMARY:${escapeText(ev.title)}`);
  if (ev.location) out.push(`LOCATION:${escapeText(ev.location)}`);
  if (ev.description) out.push(`DESCRIPTION:${escapeText(ev.description)}`);
  if (ev.category) out.push(`CATEGORIES:${escapeText(ev.category)}`);
  out.push(`STATUS:${ev.tentative ? "TENTATIVE" : "CONFIRMED"}`);
  out.push(`TRANSP:${ev.transparent ? "TRANSPARENT" : "OPAQUE"}`);
  out.push("END:VEVENT");
  return out;
}

/** One calendar file with every event, ready to serve as text/calendar. */
export function buildIcs(events: IcsEvent[], opts: { name: string; stamp?: string | null; ttl?: string }): string {
  const stamp = icsStamp(opts.stamp);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HIBE Media//HIBE Agenda//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    "X-WR-TIMEZONE:Europe/Amsterdam",
    `X-PUBLISHED-TTL:${opts.ttl ?? "PT1H"}`,
    ...VTIMEZONE,
  ];
  for (const ev of events) lines.push(...eventLines(ev, stamp));
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export { DAY };
