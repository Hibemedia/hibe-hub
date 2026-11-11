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

/* ---------- Phases (who is at turn) ---------- */
export type VideoPhase = "internal" | "client" | "plan" | "done";
export const PHASES: VideoPhase[] = ["internal", "client", "plan", "done"];
export const PHASE_LABEL: Record<VideoPhase, string> = { internal: "Interne review", client: "Bij klant", plan: "Inplannen", done: "Klaar" };
export const PHASE_STATUSES: Record<VideoPhase, VideoStatus[]> = {
  internal: ["internal_review", "feedback", "approved_internal"],
  client: ["ready_for_client", "client_review"],
  plan: ["approved_client"],
  done: ["scheduled", "archived"],
};
export const phaseOf = (s: VideoStatus): VideoPhase => PHASES.find((p) => PHASE_STATUSES[p].includes(s))!;

export type VideoTab = "mine" | VideoPhase;
export const TABS: VideoTab[] = ["mine", "internal", "client", "plan", "done"];
export const TAB_LABEL: Record<VideoTab, string> = { mine: "Voor mij", ...PHASE_LABEL };

/** "Voor mij": my uploads waiting in Feedback verwerken, plus everything in Interne controle. */
export function isForMe(i: { status: VideoStatus; uploader: string | null }, me: string | null) {
  return i.status === "internal_review" || (i.status === "feedback" && !!me && i.uploader === me);
}
export function inTab(i: { status: VideoStatus; uploader: string | null }, tab: VideoTab, me: string | null) {
  return tab === "mine" ? isForMe(i, me) : phaseOf(i.status) === tab;
}
/** Dashboard ?status= links open the matching tab. */
export const tabForStatus = (s: VideoStatus): VideoTab => (s === "internal_review" ? "mine" : phaseOf(s));

/** Age in this status: neutral, orange after 3 days, red after 7 days. */
export function ageTone(changedAt: string, now = Date.now()): "ok" | "warn" | "late" {
  const d = (now - new Date(changedAt).getTime()) / 86400000;
  return d >= 7 ? "late" : d >= 3 ? "warn" : "ok";
}
export function fmtAge(changedAt: string, now = Date.now()) {
  const h = Math.max(0, Math.floor((now - new Date(changedAt).getTime()) / 3600000));
  if (h < 1) return "zojuist";
  if (h < 24) return `${h} uur`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "dag" : "dagen"}`;
}

/** The one logical next step per status on the overview row. */
export type RowAction = "review" | "new_version" | "ready" | "remind" | "schedule" | null;
export const ROW_ACTION: Record<VideoStatus, RowAction> = {
  internal_review: "review", feedback: "new_version", approved_internal: "ready",
  ready_for_client: null, client_review: "remind", approved_client: "schedule", scheduled: null, archived: null,
};
export const ROW_ACTION_LABEL: Record<Exclude<RowAction, null>, string> = {
  review: "Beoordeel", new_version: "Upload nieuwe versie", ready: "Klaar voor klant", remind: "Herinner klant", schedule: "Markeer als ingepland",
};

/** Short WhatsApp message with the link to the client's start screen. */
export const whatsappText = (clientName: string, count: number, url: string) =>
  `Hoi ${clientName}! Er ${count === 1 ? "staat 1 nieuwe video" : `staan ${count} nieuwe video's`} voor je klaar om te beoordelen: ${url}`;

/** Stable colour slot (1–6) for a client without a logo. */
export function clientColorSlot(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 6;
}
