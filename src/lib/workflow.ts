/** Shared labels and semantic colour roles; stored statuses stay unchanged. */
export const WORKFLOW = {
  script: { label: "Script", cls: "ui-tag-neutral" },
  shoot: { label: "Draaidag", cls: "ui-tag-info" },
  plan: { label: "Edit toewijzen", cls: "ui-tag-warning" },
  edit: { label: "Montage", cls: "ui-tag-info" },
  internal_review: { label: "Interne controle", cls: "ui-tag-warning" },
  feedback: { label: "Feedback verwerken", cls: "ui-tag-danger" },
  approved_internal: { label: "CapCut", cls: "ui-tag-info" },
  ready_for_client: { label: "Mag naar klant", cls: "ui-tag-neutral" },
  client_review: { label: "Ter controle bij klant", cls: "ui-tag-info" },
  approved_client: { label: "Goedgekeurd (klant)", cls: "ui-tag-success" },
  scheduled: { label: "Ingepland", cls: "ui-tag-success" },
  archived: { label: "Archief", cls: "ui-tag-neutral" },
} as const;

export const waitDays = (since: string, now = Date.now()) => Math.max(0, Math.floor((now - new Date(since).getTime()) / 86400000));
export const waitTone = (days: number) => days > 5 ? "late" : days >= 3 ? "warn" : "ok";
export const WAIT_CLS = { ok: "ui-tag-success", warn: "ui-tag-warning", late: "ui-tag-danger" } as const;

export function clientGroupName(name: string): string {
  const clean = name.trim().toLowerCase();
  if (["feer", "feer onderdelen"].includes(clean)) return "Feer";
  if (["jebroer", "jebroer core"].includes(clean)) return "Jebroer";
  return name;
}

/** Newest first by the moment the item entered its current step. */
export function sortNewestFirst<T extends { status_changed_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(b.status_changed_at ?? 0).getTime() - new Date(a.status_changed_at ?? 0).getTime());
}

/** Newest trashed first, so the items closest to auto-deletion sink to the bottom. */
export function sortTrash<T extends { archived_at: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(b.archived_at ?? 0).getTime() - new Date(a.archived_at ?? 0).getTime());
}

export function trashDaysLeft(archivedAt: string | null, now = Date.now()): number {
  if (!archivedAt) return 0;
  const archived = new Date(archivedAt);
  const end = new Date(archived);
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(archived.getUTCDate(), last));
  return Math.max(0, Math.ceil((end.getTime() - now) / 86400000));
}