import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
/** The seven dates (Monday..Sunday) of the week containing d. */
export const weekDates = (d: Date) => { const m = mondayOf(d); return Array.from({ length: 7 }, (_, i) => { const x = new Date(m); x.setDate(x.getDate() + i); return ymd(x); }); };

export type SClient = { id: string; name: string; abbreviation: string; category: string; is_active: boolean; tracking_mode: string; weekly_target: number };
export type Post = { client_id: string; post_date: string; status: PostStatus; note: string | null; title: string | null };
export type Item = { id: string; title: string; status: PostStatus; note: string };
export type Week = { client_id: string; week_start: string; count: number; items: Item[] | null };

/** Weekly videos: stored items, or the legacy count of already delivered ones. */
export const weekItems = (w?: Week): Item[] => w?.items?.length ? w.items : Array.from({ length: w?.count ?? 0 }, (_, i) => ({ id: `legacy-${i}`, title: "", status: "scheduled" as PostStatus, note: "" }));

/** Cell colours, shared by the checklist page and the dashboard card. */
export const cellCls = (s: PostStatus) =>
  s === "scheduled" ? "bg-primary text-primary-foreground"
  : s === "none" ? "bg-card"
  : s === "to_post" ? "bg-foreground/10 text-foreground"
  : s === "in_progress" ? "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]"
  : s === "internal_check" ? "bg-[hsl(var(--social-orange))] text-white"
  : s === "client_check" ? "bg-[hsl(var(--social-blue))] text-white"
  : "bg-lime text-lime-foreground"; // to_schedule

/** Click cycles a cell to the next status in this order. */
export const STATUS_CYCLE: PostStatus[] = ["none", "to_post", "in_progress", "internal_check", "client_check", "to_schedule", "scheduled"];
export const nextStatus = (cur: PostStatus): PostStatus => STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];

/** A linked checklist cell follows the status of its video in Video's. */
export const videoToPostStatus = (s: string): PostStatus =>
  s === "internal_review" ? "internal_check"
  : s === "feedback" ? "in_progress"
  : s === "client_review" ? "client_check"
  : s === "scheduled" || s === "archived" ? "scheduled"
  : "to_schedule"; // approved_internal, ready_for_client, approved_client

export type SocialVideoLink = { id: string; social_client_id: string; post_date: string; video_item_id: string };

/** Links between checklist cells and Video's items, stored in HIBE Hub itself. */
export function useSocialVideoLinks() {
  return useQuery({
    queryKey: ["social-video-links"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("social_post_video_links").select("id,social_client_id,post_date,video_item_id");
      if (error) throw error;
      return (data ?? []) as SocialVideoLink[];
    },
  });
}
export async function linkSocialVideo(socialClientId: string, postDate: string, videoItemId: string) {
  const { error } = await (supabase as any).from("social_post_video_links").upsert({ social_client_id: socialClientId, post_date: postDate, video_item_id: videoItemId }, { onConflict: "social_client_id,post_date" });
  if (error) throw error;
}
export async function unlinkSocialVideo(id: string) {
  const { error } = await (supabase as any).from("social_post_video_links").delete().eq("id", id);
  if (error) throw error;
}

/** Live call to the HIBE Review Hub checklist through the server-side proxy. */
export async function callSocials<T>(body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke("socials-proxy", { body });
  if (error) throw error;
  if ((data as { error?: unknown })?.error) throw new Error(String((data as { error?: unknown }).error));
  return data as T;
}
