export type HighlightMoment = { id: string; title: string; client_id: string; date: string | null; start_time: string | null; status: string };

export function nextContentMoment(moments: HighlightMoment[], now = new Date()) {
  const today = now.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  const time = now.toLocaleTimeString("en-GB", { timeZone: "Europe/Amsterdam", hour12: false });
  return moments.filter((m) => m.date && m.status !== "afgerond" && m.status !== "geannuleerd" &&
    (m.date > today || (m.date === today && (!m.start_time || m.start_time >= time))))
    .sort((a, b) => `${a.date}T${a.start_time ?? "00:00:00"}`.localeCompare(`${b.date}T${b.start_time ?? "00:00:00"}`))[0];
}