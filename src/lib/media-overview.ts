import type { VideoStatus } from "./videos";

export type MediaFilters = { client: string; uploader: string; q: string; phase: string };

/** The overview narrows existing board data; it never changes a video's phase. */
export function filterMedia<T extends { client_id: string; uploader: string | null; title: string; file_name: string | null; status: VideoStatus }>(items: T[], filters: MediaFilters) {
  const q = filters.q.trim().toLocaleLowerCase("nl-NL");
  return items.filter((item) =>
    (filters.client === "all" || item.client_id === filters.client) &&
    (filters.uploader === "all" || item.uploader === filters.uploader) &&
    (filters.phase === "all" || (filters.phase === "running" ? item.status !== "scheduled" && item.status !== "archived" : item.status === filters.phase)) &&
    (!q || `${item.title} ${item.file_name ?? ""}`.toLocaleLowerCase("nl-NL").includes(q))
  );
}