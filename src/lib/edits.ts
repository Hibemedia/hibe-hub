export type EditStatus = "assign" | "todo" | "editing" | "on_hold" | "delivered";
export const EDIT_STATUSES: EditStatus[] = ["assign", "todo", "editing", "on_hold", "delivered"];
export const EDIT_STATUS_LABEL: Record<EditStatus, string> = {
  assign: "Editor aanwijzen", todo: "To-do", editing: "Wordt gemonteerd", on_hold: "On hold", delivered: "Ingeleverd",
};
export type Edit = { id: string; client_id: string; title: string; editor_id: string | null; status: EditStatus; deadline: string | null; notes: string | null; video_item_id: string | null; drive_link?: string | null; shoot_date?: string | null; created_at: string };

/** One edit per non-empty pasted line. */
export const parseTitles = (text: string) => text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);

/** Assigning an editor to an unassigned edit moves it to To-do (mirrors the database trigger). */
export function statusAfterAssign(current: EditStatus, editor: string | null): EditStatus {
  return editor && current === "assign" ? "todo" : current;
}

export type EditFilters = { client: string; editor: string; status: string; mine: boolean; showDelivered: boolean };
export function filterEdits(list: Edit[], f: EditFilters, me: string | null) {
  return list.filter((e) =>
    (f.client === "all" || e.client_id === f.client) &&
    (f.editor === "all" || (f.editor === "none" ? !e.editor_id : e.editor_id === f.editor)) &&
    (f.status === "all" || e.status === f.status) &&
    (!f.mine || (!!me && e.editor_id === me)) &&
    (f.showDelivered || f.status === "delivered" || e.status !== "delivered"));
}

export const progressLabel = (list: Edit[]) => `${list.filter((e) => e.status === "delivered").length} van ${list.length} ingeleverd`;
