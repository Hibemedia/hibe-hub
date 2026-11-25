import { periodRange, type PeriodKey } from "./stats";
import type { HighlightMoment } from "./dashboard-highlights";

/** Today's totals are partial; cap every performance window at yesterday in Amsterdam. */
export function dashboardRange(period: PeriodKey, latest: string | null, now = new Date()) {
  const today = now.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const complete = yesterday.toISOString().slice(0, 10);
  const end = latest && latest < complete ? latest : complete;
  return periodRange(period, new Date(`${end}T00:00:00Z`));
}

/** One featured moment followed by at most three upcoming moments. */
export function upcomingDashboardMoments<T extends HighlightMoment>(moments: T[], now = new Date()) {
  const today = now.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  const time = now.toLocaleTimeString("en-GB", { timeZone: "Europe/Amsterdam", hour12: false });
  return moments.filter((m) => m.date && m.status !== "afgerond" && m.status !== "geannuleerd" &&
    (m.date > today || (m.date === today && (!m.start_time || m.start_time >= time))))
    .sort((a, b) => `${a.date}T${a.start_time ?? "00:00:00"}`.localeCompare(`${b.date}T${b.start_time ?? "00:00:00"}`)).slice(0, 4);
}

export function personalFeedback<T extends { status: string; editor_id: string | null }>(items: T[], me: string) {
  return items.filter((i) => i.status === "feedback" && i.editor_id === me);
}

/** No target and no pending cells is not open work. */
export function openChecklistRows<T extends { done: number; target: number; cells: { status: string }[] }>(rows: T[]) {
  return rows.filter((r) => r.done < r.target || r.cells.some((c) => c.status !== "none" && c.status !== "scheduled"));
}