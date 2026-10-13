import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";

export type ReviewStatus = "pending" | "approved" | "rejected" | "changes_requested";

export interface ReviewItem {
  id: string;
  client_id: string;
  title: string;
  caption: string | null;
  planned_date: string | null;
  networks: string[];
  status: ReviewStatus;
  source: "hibe" | "metricool";
  storage_path: string | null;
  external_link: string | null;
  metricool_post_id: string | null;
  created_at: string;
}

export interface ReviewEvent {
  id: string;
  action: string;
  note: string | null;
  user_id: string | null;
  created_at: string;
}

export function useReviewItems() {
  const { clientId, ready } = useClient();
  return useQuery({
    queryKey: ["review-items", clientId],
    enabled: ready && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_items")
        .select("id,client_id,title,caption,planned_date,networks,status,source,storage_path,external_link,metricool_post_id,created_at")
        .eq("client_id", clientId!)
        .order("planned_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as ReviewItem[];
    },
  });
}

export function usePendingReviewCount() {
  const { clientId, ready } = useClient();
  return useQuery({
    queryKey: ["review-items", clientId, "pending-count"],
    enabled: ready && !!clientId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("review_items")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useReviewEvents(itemId: string | null) {
  return useQuery({
    queryKey: ["review-events", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_events")
        .select("id,action,note,user_id,created_at")
        .eq("review_item_id", itemId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewEvent[];
    },
  });
}

/** Upload to the private review-media bucket with progress (supabase-js has no progress callback). */
export async function uploadReviewMedia(clientId: string, file: File, onProgress: (pct: number) => void): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Niet ingelogd");
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${clientId}/${crypto.randomUUID()}.${ext}`;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/review-media/${path}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload mislukt (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload mislukt"));
    xhr.send(file);
  });
  return path;
}

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Te beoordelen",
  approved: "Goedgekeurd",
  rejected: "Afgekeurd",
  changes_requested: "Wijziging gevraagd",
};

export const REVIEW_ACTION_LABEL: Record<string, string> = {
  created: "Klaargezet",
  approved: "Goedgekeurd",
  rejected: "Afgekeurd",
  changes_requested: "Wijziging gevraagd",
  new_version: "Nieuwe versie geplaatst",
};
