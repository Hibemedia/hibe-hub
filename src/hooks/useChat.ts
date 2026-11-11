import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/lib/chat";

const db = supabase as any;
export type Room = { id: string; kind: "channel" | "dm" | "group"; name: string | null; created_at: string; members: string[] };
export type Message = { id: string; room_id: string; user_id: string; body: string; image_path: string | null; mentions: string[]; created_at: string; edited_at: string | null };
export type ChatNote = { id: string; room_id: string; kind: "dm" | "mention"; actor_id: string | null; preview: string; created_at: string; read_at: string | null };

export function useTeamMembers() {
  return useQuery({
    queryKey: ["hibe-team"],
    staleTime: 600_000,
    queryFn: async () => {
      const [{ data: roles }, { data: users }] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
        supabase.from("users").select("id,email,full_name,avatar_url"),
      ]);
      const ids = new Set((roles ?? []).map((r) => r.user_id));
      return (users ?? []).filter((u) => ids.has(u.id)).map((u) => ({ id: u.id, name: u.full_name || u.email.split("@")[0], avatar_url: u.avatar_url })) as Member[];
    },
  });
}

export function useRooms(enabled = true) {
  return useQuery({
    queryKey: ["chat-rooms"],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from("chat_rooms").select("id,kind,name,created_at,chat_members(user_id)").order("created_at");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ ...r, members: (r.chat_members ?? []).map((m: any) => m.user_id) })) as Room[];
    },
  });
}

export function useUnread(enabled = true) {
  return useQuery({
    queryKey: ["chat-unread"],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.rpc("chat_unread");
      if (error) throw error;
      const m: Record<string, number> = {};
      for (const r of data ?? []) m[r.room_id] = Number(r.unread);
      return m;
    },
  });
}

export function useMessages(roomId: string | null) {
  return useQuery({
    queryKey: ["chat-messages", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await db.from("chat_messages").select("*").eq("room_id", roomId).order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return ((data ?? []) as Message[]).reverse();
    },
  });
}

export function useChatNotes(me: string | null) {
  return useQuery({
    queryKey: ["chat-notes", me],
    enabled: !!me,
    refetchInterval: 120_000,
    queryFn: async () => {
      const { data, error } = await db.from("chat_notifications").select("id,room_id,kind,actor_id,preview,created_at,read_at").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as ChatNote[];
    },
  });
}

export const markRoomRead = (roomId: string, me: string) =>
  Promise.all([
    db.from("chat_members").update({ last_read_at: new Date().toISOString() }).eq("room_id", roomId).eq("user_id", me),
    db.from("chat_notifications").update({ read_at: new Date().toISOString() }).eq("room_id", roomId).is("read_at", null),
  ]);

/** One live subscription for the whole HIBE frame: refreshes chat data and raises browser notifications. */
export function useChatLive(me: string | null, nameOf: (id: string | null) => string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!me) return;
    const ch = supabase.channel(`chat-live-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, (p: any) => {
        const room = (p.new?.room_id ?? p.old?.room_id) as string | undefined;
        qc.invalidateQueries({ queryKey: ["chat-messages", room] });
        qc.invalidateQueries({ queryKey: ["chat-unread"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_members" }, () => {
        qc.invalidateQueries({ queryKey: ["chat-rooms"] });
        qc.invalidateQueries({ queryKey: ["chat-unread"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_notifications", filter: `recipient_id=eq.${me}` }, (p: any) => {
        qc.invalidateQueries({ queryKey: ["chat-notes"] });
        const n = p.new as ChatNote;
        const viewing = document.visibilityState === "visible" && location.pathname === "/hibe/chat" && sessionStorage.getItem("hibe.chat.room") === n.room_id;
        if (!viewing && "Notification" in window && Notification.permission === "granted") {
          const title = n.kind === "dm" ? `Bericht van ${nameOf(n.actor_id)}` : `${nameOf(n.actor_id)} noemde je`;
          const notif = new Notification(title, { body: n.preview, tag: n.id });
          notif.onclick = () => { window.focus(); location.assign(`/hibe/chat?room=${n.room_id}`); };
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps
}
