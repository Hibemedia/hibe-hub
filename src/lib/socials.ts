export type PostStatus = "none" | "to_post" | "internal_check" | "client_check" | "in_progress" | "to_schedule" | "scheduled";
export const STATUSES: { key: PostStatus; symbol: string; label: string }[] = [
  { key: "none", symbol: "", label: "Leeg" },
  { key: "to_post", symbol: ".", label: "Moet gepost" },
  { key: "internal_check", symbol: "!", label: "Interne controle" },
  { key: "client_check", symbol: "?", label: "Controle door klant" },
  { key: "in_progress", symbol: "O", label: "Wordt aan gewerkt" },
  { key: "to_schedule", symbol: "/", label: "Nog inplannen" },
  { key: "scheduled", symbol: "X", label: "Ingepland" },
];
export const WEEKLY: PostStatus[] = ["in_progress", "internal_check", "client_check", "to_post", "scheduled"];
export const statusOf = (k: string) => STATUSES.find((s) => s.key === k) ?? STATUSES[0];
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Monday of the week containing d (local date). */
export const mondayOf = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
