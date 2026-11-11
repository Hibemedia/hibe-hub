export type VideoStatus = "internal_review" | "feedback" | "approved_internal" | "ready_for_client" | "client_review" | "approved_client" | "scheduled" | "archived";

/** Board order. */
export const VIDEO_STATUSES: VideoStatus[] = ["internal_review", "feedback", "approved_internal", "ready_for_client", "client_review", "approved_client", "scheduled", "archived"];
export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  internal_review: "Interne controle",
  feedback: "Feedback verwerken",
  approved_internal: "Goedgekeurd (intern)",
  ready_for_client: "Mag naar klant",
  client_review: "Ter controle bij klant",
  approved_client: "Goedgekeurd (klant)",
  scheduled: "Ingepland",
  archived: "Archief",
};
/** Statuses a client can see (from "Ter controle bij klant" onward). */
export const CLIENT_VISIBLE: VideoStatus[] = ["client_review", "approved_client", "scheduled", "archived"];
export const isClientVisible = (s: VideoStatus) => CLIENT_VISIBLE.includes(s);

/** Number of videos waiting in "Mag naar klant" that triggers the notice. */
export const READY_THRESHOLD = 3;
export function clientsReadyToSend<T extends { client_id: string; status: VideoStatus }>(items: T[], threshold = READY_THRESHOLD) {
  const counts = new Map<string, number>();
  for (const i of items) if (i.status === "ready_for_client") counts.set(i.client_id, (counts.get(i.client_id) ?? 0) + 1);
  return [...counts].filter(([, n]) => n >= threshold).map(([client_id, count]) => ({ client_id, count }));
}

/** Where HIBE's "Goedkeuren" / "Feedback geven" buttons move a video. */
export function hibeNext(status: VideoStatus, action: "approve" | "feedback"): VideoStatus | null {
  if (action === "feedback") return status === "archived" ? null : "feedback";
  const map: Partial<Record<VideoStatus, VideoStatus>> = {
    internal_review: "approved_internal", feedback: "approved_internal", approved_internal: "ready_for_client",
    ready_for_client: "client_review", client_review: "approved_client", approved_client: "scheduled",
  };
  return map[status] ?? null;
}

export function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0"), ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtSize(bytes: number | null | undefined) {
  if (!bytes) return "";
  const u = ["B", "KB", "MB", "GB"]; let v = bytes, i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i >= 2 ? 1 : 0)} ${u[i]}`;
}
