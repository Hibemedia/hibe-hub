import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/components/UserAvatar";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useChatLive, useChatNotes, useTeamMembers } from "@/hooks/useChat";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Note = { id: string; client_id: string; item_id: string | null; kind: string; video_title: string; created_at: string; read_at: string | null; recipient_id: string | null; actor_id?: string | null };
const WHAT: Record<string, string> = { client_feedback: "heeft feedback gegeven op", client_approved: "heeft goedgekeurd:" };

/** HIBE-only bell: client feedback/approvals on videos. */
export function NotificationBell() {
  const { clients } = useClient();
  const me = ((UserAuth() as any)?.user?.id as string) ?? "";
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: notes = [] } = useQuery({
    queryKey: ["hibe-notifications", me],
    enabled: !!me,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("hibe_notifications" as any).select("id,client_id,item_id,kind,video_title,created_at,read_at,recipient_id,actor_id").or(`recipient_id.is.null,recipient_id.eq.${me}`).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as Note[];
    },
  });
  const { data: invites = [] } = useQuery({
    queryKey: ["agenda-invites", me],
    enabled: !!me,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("calendar_attendees").select("event_id,created_at,seen_at,invited_by,event:calendar_events(title,start_date,start_time)").eq("user_id", me).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return ((data ?? []) as any[]).filter((r) => r.event).map((r) => ({ id: `inv:${r.event_id}`, event_id: r.event_id as string, created_at: r.created_at as string, read_at: r.seen_at as string | null, actor_id: r.invited_by as string | null, title: r.event.title as string, date: r.event.start_date as string, time: (r.event.start_time ?? "").slice(0, 5) }));
    },
  });
  const { data: team = [] } = useTeamMembers();
  const person = (id: string | null) => team.find((t) => t.id === id)?.name ?? "Iemand";
  useChatLive(me, person);
  const { data: chat = [] } = useChatNotes(me);
  const unread = [...notes.filter((n) => !n.read_at), ...chat.filter((n) => !n.read_at), ...invites.filter((n) => !n.read_at)];
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    const now = new Date().toISOString();
    const inv = ids.filter((i) => i.startsWith("inv:")).map((i) => i.slice(4));
    ids = ids.filter((i) => !i.startsWith("inv:"));
    await Promise.all([
      inv.length ? (supabase as any).from("calendar_attendees").update({ seen_at: now }).eq("user_id", me).in("event_id", inv) : null,
      supabase.from("hibe_notifications" as any).update({ read_at: now }).in("id", ids),
      supabase.from("chat_notifications" as any).update({ read_at: now }).in("id", ids),
    ]);
    qc.invalidateQueries({ queryKey: ["hibe-notifications"] });
    qc.invalidateQueries({ queryKey: ["chat-notes"] });
    qc.invalidateQueries({ queryKey: ["agenda-invites"] });
  };
  const all = [
    ...notes.map((n) => ({ at: n.created_at, el: { n, chat: false as const } })),
    ...chat.map((c) => ({ at: c.created_at, el: { c, chat: true as const } })),
    ...invites.map((v) => ({ at: v.created_at, el: { v, chat: "inv" as const } })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
  const when = (d: string) => new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label={`Meldingen${unread.length ? ` (${unread.length} nieuw)` : ""}`} className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-popover hover:bg-muted">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-lime px-1 text-center text-[11px] font-bold leading-5 text-lime-foreground tabular">{unread.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Meldingen</p>
          {unread.length > 0 && <button onClick={() => markRead(unread.map((n) => n.id))} className="text-xs text-muted-foreground hover:text-foreground">Alles gelezen</button>}
        </div>
        {all.length === 0 ? <p className="px-4 py-6 text-center text-sm text-muted-foreground">Hier zie je feedback van klanten, nieuwe edits en chatberichten voor jou.</p> : (
          <ul className="max-h-96 overflow-y-auto">
            {all.map(({ el }) => el.chat === "inv" ? (
              <li key={el.v.id}>
                <button onClick={() => { markRead([el.v.id]); nav("/hibe/agenda"); }} className="flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-muted">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${el.v.read_at ? "bg-transparent" : "bg-lime"}`} />{el.v.actor_id && <UserAvatar userId={el.v.actor_id} size={28} />}
                  <span className="min-w-0"><b>{person(el.v.actor_id)}</b> heeft je uitgenodigd voor <span className="font-medium">{el.v.title}</span>
                    <span className="block text-xs text-muted-foreground">{new Date(el.v.date).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}{el.v.time ? ` om ${el.v.time}` : ""}</span></span>
                </button>
              </li>
            ) : el.chat ? (
              <li key={el.c.id}>
                <button onClick={() => { markRead([el.c.id]); nav(`/hibe/chat?room=${el.c.room_id}`); }} className="flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-muted">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${el.c.read_at ? "bg-transparent" : "bg-lime"}`} /><UserAvatar userId={el.c.actor_id} size={28} />
                  <span className="min-w-0"><b>{person(el.c.actor_id)}</b> {el.c.kind === "dm" ? "stuurde je een bericht:" : "noemde je in de chat:"} <span className="line-clamp-2 font-medium">{el.c.preview}</span>
                    <span className="block text-xs text-muted-foreground">{when(el.c.created_at)}</span></span>
                </button>
              </li>
            ) : ((n) => (
              <li key={n.id}>
                <button onClick={() => { markRead([n.id]); if (n.kind === "edit_assigned") nav("/hibe/edits"); else if (n.kind === "crew_assigned") nav("/hibe/contentmomenten"); else if (n.item_id) nav(`/hibe/videos/${n.item_id}`); }} className="flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-muted">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-lime"}`} />{n.actor_id && <UserAvatar userId={n.actor_id} size={28} />}
                  <span className="min-w-0">{n.kind === "crew_assigned" ? <>Je staat op een draaidag bij <b>{name(n.client_id)}</b>: <span className="font-medium">{n.video_title}</span></> : n.kind === "edit_assigned" ? <>Nieuwe edit voor jou bij <b>{name(n.client_id)}</b>: <span className="font-medium">{n.video_title}</span></> : <><b>{name(n.client_id)}</b> {WHAT[n.kind] ?? n.kind} <span className="font-medium">{n.video_title}</span></>}
                    <span className="block text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></span>
                </button>
              </li>
            ))((el as { n: Note }).n))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
