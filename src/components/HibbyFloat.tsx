import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessages, useRooms, useUnread, markRoomRead } from "@/hooks/useChat";
import { isSendKey } from "@/lib/chat";
import { toast } from "sonner";

const db = supabase as any;
const HIBBY_ID = "00000000-0000-4000-8000-00000000b1bb";

/** Floating personal-assistant button: opens the private Hibby conversation in a small panel, on every HIBE page. */
export function HibbyFloat() {
  const me = ((UserAuth() as any)?.user?.id as string) ?? null;
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rooms = [] } = useRooms(!!me);
  const { data: unread = {} } = useUnread(!!me);
  const room = rooms.find((r) => r.kind === "hibby") ?? null;
  const { data: msgs = [] } = useMessages(open ? room?.id ?? null : null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ block: "end" }); }, [open, msgs.length]);

  // The chat page already shows the conversation full-screen; don't double it.
  if (pathname.startsWith("/hibe/chat")) return null;

  const ensureRoom = async (): Promise<string | null> => {
    if (room) return room.id;
    const id = crypto.randomUUID();
    const { error } = await db.from("chat_rooms").insert({ id, kind: "hibby", name: "Hibby", created_by: me });
    if (!error) {
      const { error: e2 } = await db.from("chat_members").insert({ room_id: id, user_id: me });
      if (e2) { toast.error(e2.message); return null; }
    } else { toast.error(error.message); return null; }
    await qc.invalidateQueries({ queryKey: ["chat-rooms"] });
    return id;
  };

  const toggle = async () => {
    if (open) return setOpen(false);
    const id = await ensureRoom();
    if (!id) return;
    setOpen(true);
    markRoomRead(id, me!).then(() => qc.invalidateQueries({ queryKey: ["chat-unread"] }));
    setTimeout(() => taRef.current?.focus(), 50);
  };

  const send = async () => {
    const body = text.trim();
    if (!body || busy || !room) return;
    setBusy(true);
    try {
      const { error } = await db.from("chat_messages").insert({ room_id: room.id, user_id: me, body, image_path: null, mentions: [] });
      if (error) throw error;
      setText("");
      qc.invalidateQueries({ queryKey: ["chat-messages", room.id] });
      await supabase.functions.invoke("hibby", { body: { room_id: room.id } });
      qc.invalidateQueries({ queryKey: ["chat-messages", room.id] });
    } catch (e: any) { toast.error(e.message ?? "Versturen lukte niet"); }
    setBusy(false);
  };

  const count = room ? unread[room.id] ?? 0 : 0;

  return (
    <>
      {open && room && (
        <section aria-label="Gesprek met Hibby" className="fixed bottom-20 right-4 z-[70] flex h-[30rem] max-h-[70dvh] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3">
            <UserAvatar userId={HIBBY_ID} name="Hibby" url={null} size={26} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Hibby</p>
              <p className="text-xs text-muted-foreground leading-tight">Je persoonlijke assistent</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Sluiten" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {msgs.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Vraag Hibby iets of laat hem iets regelen. Bijvoorbeeld: "Wanneer kan ik met Jeroen overleggen?" of "Maak een taak: offerte sturen, morgen".</p>}
            {msgs.map((m) => {
              const mine = m.user_id === me;
              return (
                <div key={m.id} className={`mb-2 flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  {!mine && <UserAvatar userId={HIBBY_ID} name="Hibby" url={null} size={24} />}
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-foreground text-background" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`mt-0.5 text-[10px] ${mine ? "opacity-60" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              );
            })}
            {busy && <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><UserAvatar userId={HIBBY_ID} name="Hibby" url={null} size={24} /><span className="animate-pulse">Hibby denkt na…</span></div>}
            <div ref={endRef} />
          </div>
          <div className="shrink-0 border-t border-border p-2.5">
            <div className="flex items-end gap-2">
              <Textarea ref={taRef} rows={1} value={text} onChange={(e) => setText(e.target.value)} aria-label="Bericht aan Hibby"
                onKeyDown={(e) => { if (isSendKey(e.nativeEvent as any)) { e.preventDefault(); send(); } }}
                placeholder="Vraag het aan Hibby…" className="max-h-28 min-h-9 resize-none" />
              <Button size="icon" aria-label="Versturen" disabled={!text.trim() || busy} onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </section>
      )}
      <button onClick={toggle} aria-label="Hibby, je persoonlijke assistent" className="fixed bottom-4 right-4 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-lime text-lime-foreground shadow-md transition-transform hover:scale-105">
        <UserAvatar userId={HIBBY_ID} name="Hibby" url={null} size={30} />
        {!open && count > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-foreground px-1 text-center text-[11px] font-bold leading-5 text-background tabular" aria-label={`${count} ongelezen`}>{count}</span>}
      </button>
    </>
  );
}
