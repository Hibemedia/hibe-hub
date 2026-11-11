import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VideoStatus } from "@/lib/videos";
import { invokeVideo } from "@/lib/r2Upload";

export type VideoItem = { id: string; client_id: string; title: string; status: VideoStatus; current_version: number; drive_link: string | null; created_at: string; status_changed_at: string };
export type VideoVersion = { id: string; item_id: string; version: number; file_name: string; size_bytes: number | null; upload_status: string; created_at: string };
export type VideoComment = { id: string; item_id: string; version_id: string; number: number; time_seconds: number; text: string; internal: boolean; resolved: boolean; user_id: string; created_at: string };

const db = supabase as any;

export function useVideoItems(clientId?: string | null) {
  return useQuery({
    queryKey: ["video-items", clientId ?? "all"],
    queryFn: async () => {
      let q = db.from("video_items").select("id,client_id,title,status,current_version,drive_link,created_at,status_changed_at").order("status_changed_at", { ascending: false });
      if (clientId) q = q.eq("client_id", clientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as VideoItem[];
    },
  });
}
export function useVideoItem(id?: string) {
  return useQuery({
    enabled: !!id,
    queryKey: ["video-item", id],
    queryFn: async () => {
      const [{ data: item, error }, { data: versions }] = await Promise.all([
        db.from("video_items").select("id,client_id,title,status,current_version,drive_link,created_at,status_changed_at").eq("id", id).maybeSingle(),
        db.from("video_versions").select("id,item_id,version,file_name,size_bytes,upload_status,created_at").eq("item_id", id).eq("upload_status", "ready").order("version"),
      ]);
      if (error) throw error;
      return { item: item as VideoItem | null, versions: (versions ?? []) as VideoVersion[] };
    },
  });
}
export function useVideoComments(versionId?: string) {
  return useQuery({
    enabled: !!versionId,
    queryKey: ["video-comments", versionId],
    queryFn: async () => {
      const { data, error } = await db.from("video_comments").select("*").eq("version_id", versionId).order("time_seconds").order("number");
      if (error) throw error;
      return (data ?? []) as VideoComment[];
    },
  });
}
export function usePlayUrl(versionId?: string) {
  return useQuery({
    enabled: !!versionId,
    queryKey: ["video-play", versionId],
    staleTime: 3 * 60 * 60 * 1000,
    queryFn: async () => (await invokeVideo<{ url: string }>({ action: "play_url", version_id: versionId })).url,
  });
}
export const setVideoStatus = async (id: string, status: VideoStatus) => {
  const { error } = await db.from("video_items").update({ status }).eq("id", id);
  if (error) throw error;
};

/** Overview rows: items + uploader + latest ready version + open comment count. */
export type BoardItem = VideoItem & { uploader: string | null; versionId: string | null; openComments: number };
export function useVideoBoard(opts: { includeDone?: boolean } = {}) {
  return useQuery({
    queryKey: ["video-items", "board", !!opts.includeDone],
    queryFn: async () => {
      let q = db.from("video_items").select("id,client_id,title,status,current_version,drive_link,created_at,status_changed_at,created_by").order("status_changed_at", { ascending: false });
      if (!opts.includeDone) q = q.not("status", "in", "(scheduled,archived)");
      const { data: items, error } = await q;
      if (error) throw error;
      const ids = (items ?? []).map((i: any) => i.id);
      if (!ids.length) return [] as BoardItem[];
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));
      const vers: any[] = [], open: any[] = [];
      await Promise.all(chunks.map(async (c) => {
        const [{ data: v }, { data: o }] = await Promise.all([
          db.from("video_versions").select("id,item_id,version,uploaded_by").in("item_id", c).eq("upload_status", "ready"),
          db.from("video_comments").select("item_id").in("item_id", c).eq("resolved", false),
        ]);
        vers.push(...(v ?? [])); open.push(...(o ?? []));
      }));
      const latest = new Map<string, any>();
      for (const v of vers) if (!latest.has(v.item_id) || latest.get(v.item_id).version < v.version) latest.set(v.item_id, v);
      const counts = new Map<string, number>();
      for (const o of open) counts.set(o.item_id, (counts.get(o.item_id) ?? 0) + 1);
      return (items as any[]).map((i) => ({
        ...i, uploader: latest.get(i.id)?.uploaded_by ?? i.created_by ?? null, versionId: latest.get(i.id)?.id ?? null, openComments: counts.get(i.id) ?? 0,
      })) as BoardItem[];
    },
  });
}

/** All comments of an item, across versions (RLS hides internal ones from clients). */
export function useItemComments(itemId?: string) {
  return useQuery({
    enabled: !!itemId,
    queryKey: ["video-comments", "item", itemId],
    queryFn: async () => {
      const { data, error } = await db.from("video_comments").select("*").eq("item_id", itemId).order("time_seconds").order("number");
      if (error) throw error;
      return (data ?? []) as VideoComment[];
    },
  });
}

/** Display names for user ids (falls back to e-mail prefix). */
export function useUserNames() {
  return useQuery({
    queryKey: ["user-names"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await db.from("users").select("id,full_name,email");
      const m: Record<string, string> = {};
      for (const u of data ?? []) m[u.id] = u.full_name || (u.email ?? "").split("@")[0];
      return m;
    },
  });
}
