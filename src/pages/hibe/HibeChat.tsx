import { useEffect, useMemo, useRef, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Hash, ImagePlus, MoreHorizontal, Plus, Send, Settings2, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { PageHeader } from "@/components/PageHeader";
import { Room, Message, useRooms, useUnread, useMessages, useTeamMembers, markRoomRead } from "@/hooks/useChat";
import { Member, extractMentions, handleOf, imageError, isSendKey, roomTitle } from "@/lib/chat";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const db = supabase as any;
const ASKED = "hibe.chat.notifyAsked";

function Avatar({ m, size = 32 }: { m?: Member; size?: number }) {
  return <UserAvatar userId={m?.id} name={m?.name ?? "?"} url={m?.avatar_url ?? null} size={size} />;
}
const Count = ({ n }: { n?: number }) => (n ? <span className="ml-auto min-w-5 rounded-full bg-lime px-1.5 text-center text-[11px] font-bold leading-5 text-lime-foreground tabular" aria-label={`${n} ongelezen`}>{n}</span> : null);

export default function HibeChat() {
  const me = ((UserAuth() as any)?.user?.id as string) ?? null;
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const roomId = params.get("room");
  const { data: rooms = [] } = useRooms();
  const { data: unread = {} } = useUnread();
  const { data: team = [] } = useTeamMembers();
  const [dialog, setDialog] = useState<null | "channel" | "dm" | "settings">(null);
  const [askNotify, setAskNotify] = useState(() => "Notification" in window && Notification.permission === "default" && !localStorage.getItem(ASKED));
  const person = (id: string) => team.find((t) => t.id === id);
  const others = (r: Room) => r.members.filter((u) => u !== me).map(person).filter(Boolean) as Member[];
  const room = rooms.find((r) => r.id === roomId) ?? null;
  const open = (id: string | null) => setParams(id ? { room: id } : {}, { replace: false });

  useEffect(() => { // desktop: open the first channel by default
    if (!roomId && rooms.length && window.matchMedia("(min-width: 768px)").matches) open(rooms.find((r) => r.kind === "channel")?.id ?? rooms[0].id);
  }, [rooms.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (roomId) sessionStorage.setItem("hibe.chat.room", roomId); else sessionStorage.removeItem("hibe.chat.room"); return () => sessionStorage.removeItem("hibe.chat.room"); }, [roomId]);

  const channels = rooms.filter((r) => r.kind === "channel");
  const convos = rooms.filter((r) => r.kind !== "channel");
  const enableNotify = async () => { localStorage.setItem(ASKED, "1"); setAskNotify(false); try { await Notification.requestPermission(); } catch { /* ignore */ } };

  const RoomLink = ({ r }: { r: Room }) => (
    <button onClick={() => open(r.id)} className={cn("flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm", r.id === roomId ? "bg-foreground text-background" : "hover:bg-muted", unread[r.id] && r.id !== roomId && "font-semibold")}>
      {r.kind === "channel" ? <Hash className="h-4 w-4 shrink-0 opacity-70" /> : r.kind === "dm" ? <Avatar m={others(r)[0]} size={22} /> : <Users className="h-4 w-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1 truncate">{roomTitle(r, others(r))}</span>
      {r.id !== roomId && <Count n={unread[r.id]} />}
    </button>
  );

  return (
    <>
      <PageHeader title="Chat" />
      <div className="flex h-[calc(100dvh-9rem)] overflow-hidden rounded-lg border border-border bg-card md:h-[calc(100dvh-5.5rem)]">
        <aside className={cn("w-full shrink-0 flex-col overflow-y-auto border-border p-2 md:flex md:w-64 md:border-r", room ? "hidden" : "flex")}>
          {askNotify && (
            <div className="mb-2 rounded-md bg-muted p-3 text-xs">
              <p className="mb-2">Krijg een browsermelding bij een direct bericht of @vermelding.</p>
              <div className="flex gap-2"><Button size="sm" onClick={enableNotify}><Bell className="mr-1 h-3.5 w-3.5" />Aanzetten</Button><Button size="sm" variant="ghost" onClick={() => { localStorage.setItem(ASKED, "1"); setAskNotify(false); }}>Niet nu</Button></div>
            </div>
          )}
          <Section title="Kanalen" onAdd={() => setDialog("channel")} addLabel="Kanaal aanmaken">{channels.map((r) => <RoomLink key={r.id} r={r} />)}</Section>
          <Section title="Directe berichten" onAdd={() => setDialog("dm")} addLabel="Nieuw gesprek">
            {convos.length ? convos.map((r) => <RoomLink key={r.id} r={r} />) : <p className="px-2.5 py-2 text-xs text-muted-foreground">Nog geen gesprekken. Start er een met de plusknop.</p>}
          </Section>
        </aside>
        {room ? (
          <Conversation key={room.id} room={room} me={me!} team={team} title={roomTitle(room, others(room))} others={others(room)} onBack={() => open(null)} onSettings={() => setDialog("settings")}
            onRead={() => { markRoomRead(room.id, me!).then(() => { qc.invalidateQueries({ queryKey: ["chat-unread"] }); qc.invalidateQueries({ queryKey: ["chat-notes"] }); }); }} />
        ) : <div className="hidden flex-1 items-center justify-center text-sm text-muted-foreground md:flex">Kies een kanaal of gesprek.</div>}
      </div>
      {dialog === "channel" && <RoomDialog mode="channel" team={team} me={me!} onClose={() => setDialog(null)} onCreated={(id) => { qc.invalidateQueries({ queryKey: ["chat-rooms"] }); open(id); }} />}
      {dialog === "dm" && <RoomDialog mode="dm" team={team} me={me!} onClose={() => setDialog(null)} onCreated={(id) => { qc.invalidateQueries({ queryKey: ["chat-rooms"] }); open(id); }} />}
      {dialog === "settings" && room && <SettingsDialog room={room} team={team} me={me!} onClose={() => setDialog(null)} onLeft={() => open(null)} />}
    </>
  );
}

function Section({ title, onAdd, addLabel, children }: { title: string; onAdd: () => void; addLabel: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-2.5 py-1.5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <button onClick={onAdd} aria-label={addLabel} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"><Plus className="h-4 w-4" /></button></div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function ChatImage({ path }: { path: string }) {
  const { data: url } = useQuery({ queryKey: ["chat-image", path], staleTime: 50 * 60_000, queryFn: async () => (await supabase.storage.from("chat-images").createSignedUrl(path, 3600)).data?.signedUrl ?? null });
  if (!url) return <div className="h-40 w-56 animate-pulse rounded-md bg-muted" />;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Afbeelding" className="mt-1 max-h-72 max-w-full rounded-md border border-border object-contain" /></a>;
}

function Body({ text, team }: { text: string; team: Member[] }) {
  const handles = new Set(team.map((t) => handleOf(t.name)));
  return <p className="whitespace-pre-wrap break-words text-sm">{text.split(/(@[\p{L}\p{N}._-]+)/u).map((p, i) => p.startsWith("@") && handles.has(p.slice(1).toLowerCase()) ? <span key={i} className="rounded bg-lime px-1 font-medium text-lime-foreground">{p}</span> : p)}</p>;
}

function Conversation({ room, me, team, title, others, onBack, onSettings, onRead }: { room: Room; me: string; team: Member[]; title: string; others: Member[]; onBack: () => void; onSettings: () => void; onRead: () => void }) {
  const qc = useQueryClient();
  const { data: msgs = [] } = useMessages(room.id);
  const [text, setText] = useState("");
  const [img, setImg] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState<Message | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const roomTeam = team.filter((t) => room.members.includes(t.id));
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); onRead(); }, [msgs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = text.match(/@([\p{L}\p{N}._-]*)$/u)?.[1]?.toLowerCase();
  const suggestions = q !== undefined ? roomTeam.filter((t) => t.id !== me && handleOf(t.name).startsWith(q)).slice(0, 5) : [];
  const pickMention = (m: Member) => { setText((t) => t.replace(/@([\p{L}\p{N}._-]*)$/u, `@${handleOf(m.name)} `)); taRef.current?.focus(); };

  const send = async () => {
    const body = text.trim();
    if ((!body && !img) || sending) return;
    setSending(true);
    try {
      let image_path: string | null = null;
      if (img) {
        image_path = `${room.id}/${crypto.randomUUID()}-${img.name.replace(/[^\w.\-]+/g, "_").slice(-80)}`;
        const { error } = await supabase.storage.from("chat-images").upload(image_path, img, { contentType: img.type });
        if (error) throw error;
      }
      const { error } = await db.from("chat_messages").insert({ room_id: room.id, user_id: me, body, image_path, mentions: extractMentions(body, roomTeam) });
      if (error) throw error;
      setText(""); setImg(null);
      qc.invalidateQueries({ queryKey: ["chat-messages", room.id] });
    } catch (e: any) { toast.error(e.message ?? "Versturen lukte niet"); }
    setSending(false);
  };
  const pickImage = (f?: File | null) => { if (!f) return; const err = imageError(f); if (err) return toast.error(err); setImg(f); };
  const remove = async (m: Message) => { const { error } = await db.from("chat_messages").delete().eq("id", m.id); if (error) toast.error(error.message); qc.invalidateQueries({ queryKey: ["chat-messages", room.id] }); };

  let lastDay = "";
  return (
    <section className="fixed inset-0 z-50 flex min-w-0 flex-1 flex-col bg-card md:static md:z-auto" aria-label={`Gesprek ${title}`}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
        <button onClick={onBack} aria-label="Terug naar lijst" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted md:hidden"><ArrowLeft className="h-5 w-5" /></button>
        {room.kind === "channel" ? <Hash className="h-4 w-4" /> : room.kind === "dm" ? <Avatar m={others[0]} size={26} /> : <Users className="h-4 w-4" />}
        <h2 className="min-w-0 flex-1 truncate font-semibold">{title}</h2>
        {room.kind !== "dm" && <span className="hidden text-xs text-muted-foreground sm:inline">{room.members.length} leden</span>}
        {room.kind !== "dm" && <button onClick={onSettings} aria-label="Kanaalinstellingen" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"><Settings2 className="h-4 w-4" /></button>}
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-3 md:px-5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickImage(e.dataTransfer.files[0]); }}>
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nog geen berichten. Stuur het eerste bericht.</p>}
        {msgs.map((m) => {
          const day = new Date(m.created_at).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
          const showDay = day !== lastDay; lastDay = day;
          const author = team.find((t) => t.id === m.user_id);
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs font-medium text-muted-foreground">{day}</p>}
              <div className="group flex gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <Avatar m={author} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><span className="font-semibold">{author?.name ?? "Teamlid"}</span> <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}{m.edited_at && " · bewerkt"}</span></p>
                  {editing?.id === m.id ? <EditBox m={m} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["chat-messages", room.id] }); }} /> : (<>
                    {m.body && <Body text={m.body} team={team} />}
                    {m.image_path && <ChatImage path={m.image_path} />}
                  </>)}
                </div>
                {m.user_id === me && editing?.id !== m.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger aria-label="Berichtopties" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-100 hover:bg-muted md:opacity-0 md:group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(m)}>Bewerken</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => remove(m)} className="text-destructive">Verwijderen</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="relative shrink-0 border-t border-border p-3">
        {suggestions.length > 0 && (
          <ul className="absolute bottom-full left-3 mb-1 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-sm">
            {suggestions.map((s) => <li key={s.id}><button onMouseDown={(e) => { e.preventDefault(); pickMention(s); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"><Avatar m={s} size={20} />{s.name}</button></li>)}
          </ul>
        )}
        {img && <div className="mb-2 flex items-center gap-2 text-xs"><ImagePlus className="h-4 w-4" /><span className="truncate">{img.name}</span><button aria-label="Afbeelding weghalen" onClick={() => setImg(null)}><X className="h-3.5 w-3.5" /></button></div>}
        <div className="flex items-end gap-2">
          <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-muted" aria-label="Afbeelding toevoegen">
            <ImagePlus className="h-5 w-5" /><input type="file" accept="image/*" className="hidden" onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <Textarea ref={taRef} rows={1} value={text} onChange={(e) => setText(e.target.value)} aria-label="Bericht"
            onKeyDown={(e) => { if (isSendKey(e.nativeEvent as any)) { e.preventDefault(); if (suggestions.length && q && handleOf(suggestions[0].name) !== q) pickMention(suggestions[0]); else send(); } }}
            onPaste={(e) => { const f = Array.from(e.clipboardData.files)[0]; if (f) { e.preventDefault(); pickImage(f); } }}
            placeholder={`Bericht aan ${title}`} className="max-h-40 min-h-10 resize-none" />
          <Button size="icon" aria-label="Versturen" disabled={(!text.trim() && !img) || sending} onClick={send}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </section>
  );
}

function EditBox({ m, onDone }: { m: Message; onDone: () => void }) {
  const [t, setT] = useState(m.body);
  const save = async () => { const { error } = await db.from("chat_messages").update({ body: t.trim(), edited_at: new Date().toISOString() }).eq("id", m.id); if (error) toast.error(error.message); onDone(); };
  return (
    <div className="mt-1 space-y-2">
      <Textarea autoFocus rows={2} value={t} onChange={(e) => setT(e.target.value)} aria-label="Bericht bewerken" onKeyDown={(e) => { if (isSendKey(e.nativeEvent as any)) { e.preventDefault(); save(); } if (e.key === "Escape") onDone(); }} />
      <div className="flex gap-2"><Button size="sm" onClick={save} disabled={!t.trim() && !m.image_path}>Opslaan</Button><Button size="sm" variant="ghost" onClick={onDone}>Annuleren</Button></div>
    </div>
  );
}

function MemberPicker({ team, selected, onChange, exclude }: { team: Member[]; selected: string[]; onChange: (s: string[]) => void; exclude?: string }) {
  return (
    <ul className="max-h-60 space-y-1 overflow-y-auto">
      {team.filter((t) => t.id !== exclude).map((t) => (
        <li key={t.id}><label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
          <Checkbox checked={selected.includes(t.id)} onCheckedChange={(v) => onChange(v ? [...selected, t.id] : selected.filter((s) => s !== t.id))} />
          <Avatar m={t} size={24} /><span className="text-sm">{t.name}</span></label></li>
      ))}
    </ul>
  );
}

function RoomDialog({ mode, team, me, onClose, onCreated }: { mode: "channel" | "dm"; team: Member[]; me: string; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [sel, setSel] = useState<string[]>(mode === "channel" ? team.map((t) => t.id).filter((id) => id !== me) : []);
  const [busy, setBusy] = useState(false);
  const group = mode === "dm" && sel.length > 1;
  const create = async () => {
    setBusy(true);
    try {
      if (mode === "dm" && sel.length === 1) {
        const { data, error } = await db.rpc("chat_open_dm", { _other: sel[0] }); if (error) throw error; onCreated(data);
      } else {
        const id = crypto.randomUUID();
        const { error } = await db.from("chat_rooms").insert({ id, kind: mode === "channel" ? "channel" : "group", name: name.trim(), created_by: me });
        if (error) throw error;
        const { error: e2 } = await db.from("chat_members").insert([me, ...sel].map((user_id) => ({ room_id: id, user_id })));
        if (e2) throw e2;
        onCreated(id);
      }
      onClose();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };
  const needName = mode === "channel" || group;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{mode === "channel" ? "Kanaal aanmaken" : "Nieuw gesprek"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {mode === "dm" && <p className="text-sm text-muted-foreground">Kies één teamlid voor een direct bericht, of meerdere voor een groepsgesprek.</p>}
          {needName && <div className="space-y-1.5"><Label htmlFor="rn">{mode === "channel" ? "Naam van het kanaal" : "Naam van de groep"}</Label><Input id="rn" value={name} onChange={(e) => setName(e.target.value)} /></div>}
          <div className="space-y-1.5"><Label>Leden</Label><MemberPicker team={team} selected={sel} onChange={setSel} exclude={me} /></div>
        </div>
        <DialogFooter><Button disabled={busy || (needName && !name.trim()) || (mode === "dm" && !sel.length)} onClick={create}>{mode === "channel" ? "Aanmaken" : group ? "Groep starten" : "Gesprek starten"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsDialog({ room, team, me, onClose, onLeft }: { room: Room; team: Member[]; me: string; onClose: () => void; onLeft: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(room.name ?? "");
  const [sel, setSel] = useState<string[]>(room.members.filter((m) => m !== me));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const current = room.members.filter((m) => m !== me);
    const add = sel.filter((s) => !current.includes(s)), del = current.filter((c) => !sel.includes(c));
    const ops = [
      name.trim() !== (room.name ?? "") ? db.from("chat_rooms").update({ name: name.trim() }).eq("id", room.id) : null,
      add.length ? db.from("chat_members").insert(add.map((user_id) => ({ room_id: room.id, user_id }))) : null,
      del.length ? db.from("chat_members").delete().eq("room_id", room.id).in("user_id", del) : null,
    ].filter(Boolean);
    const res = await Promise.all(ops);
    const err = res.find((r: any) => r.error);
    setBusy(false);
    if (err) return toast.error((err as any).error.message);
    qc.invalidateQueries({ queryKey: ["chat-rooms"] }); toast.success("Opgeslagen"); onClose();
  };
  const leave = async () => { await db.from("chat_members").delete().eq("room_id", room.id).eq("user_id", me); qc.invalidateQueries({ queryKey: ["chat-rooms"] }); onClose(); onLeft(); };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{room.kind === "channel" ? "Kanaal" : "Groep"} beheren</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="sn">Naam</Label><Input id="sn" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Leden</Label><MemberPicker team={team} selected={sel} onChange={setSel} exclude={me} /></div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={leave}>Verlaten</Button>
          <Button disabled={busy || !name.trim()} onClick={save}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
