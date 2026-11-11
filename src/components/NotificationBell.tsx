import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Note = { id: string; client_id: string; item_id: string | null; kind: string; video_title: string; created_at: string; read_at: string | null };
const WHAT: Record<string, string> = { client_feedback: "heeft feedback gegeven op", client_approved: "heeft goedgekeurd:" };

/** HIBE-only bell: client feedback/approvals on videos. */
export function NotificationBell() {
  const { clients } = useClient();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: notes = [] } = useQuery({
    queryKey: ["hibe-notifications"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("hibe_notifications" as any).select("id,client_id,item_id,kind,video_title,created_at,read_at").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as Note[];
    },
  });
  const unread = notes.filter((n) => !n.read_at);
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    await supabase.from("hibe_notifications" as any).update({ read_at: new Date().toISOString() }).in("id", ids);
    qc.invalidateQueries({ queryKey: ["hibe-notifications"] });
  };
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
        {notes.length === 0 ? <p className="px-4 py-6 text-center text-sm text-muted-foreground">Hier zie je wanneer een klant feedback geeft of een video goedkeurt.</p> : (
          <ul className="max-h-96 overflow-y-auto">
            {notes.map((n) => (
              <li key={n.id}>
                <button onClick={() => { markRead([n.id]); if (n.item_id) nav(`/hibe/videos/${n.item_id}`); }} className="flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-muted">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-lime"}`} />
                  <span className="min-w-0"><b>{name(n.client_id)}</b> {WHAT[n.kind] ?? n.kind} <span className="font-medium">{n.video_title}</span>
                    <span className="block text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
