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
