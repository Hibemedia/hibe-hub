import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, MessageSquare, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { useClient } from "@/context/ClientContext";
import { useBase } from "@/lib/paths";
import { useVideoBoard, useVideoItem, usePlayUrl, useItemComments } from "@/hooks/useVideos";
import { Player, PlayerHandle } from "@/components/videos/Player";
import { fmtTime } from "@/lib/videos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const db = supabase as any;

/** Client review: /videos/beoordelen walks the queue one by one; /videos/:id opens a single video. */
export default function ClientReview() {
  const { videoId: id } = useParams();
  const flow = id === "beoordelen";
  const { clientId, isAdmin } = useClient();
  const base = useBase();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: board = [], isLoading: boardLoading } = useVideoBoard({ includeDone: true });
  const [queue, setQueue] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Record<string, "approved" | "changes">>({});
  useEffect(() => {
    if (queue || boardLoading) return;
    setQueue(flow ? board.filter((i) => i.client_id === clientId && i.status === "client_review" && !i.archived_at).map((i) => i.id) : id ? [id] : []);
  }, [boardLoading, board, flow, id, clientId, queue]);
  useEffect(() => { setQueue(null); setIdx(0); setResults({}); }, [id]);

  const current = queue?.[idx];
  const done = queue !== null && (queue.length === 0 ? flow : idx >= queue.length);
  if (queue === null) return <div className="p-8 text-sm text-muted-foreground">Laden…</div>;
  if (done) {
    const a = Object.values(results).filter((r) => r === "approved").length, c = Object.values(results).filter((r) => r === "changes").length;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 pt-16 text-center">
        <PageHeader title="Video's" />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime text-lime-foreground"><Check className="h-7 w-7" /></span>
        <h1 className="text-2xl font-semibold">{queue.length ? "Klaar met beoordelen" : "Niets te beoordelen"}</h1>
        {queue.length > 0 && <div className="grid w-full grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-3xl font-light tabular">{a}</p><p className="text-sm text-muted-foreground">goedgekeurd</p></div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-3xl font-light tabular">{c}</p><p className="text-sm text-muted-foreground">met wijzigingen</p></div>
        </div>}
        <p className="text-sm text-muted-foreground">{queue.length ? "Bedankt voor je beoordeling! HIBE gaat er direct mee aan de slag." : "Zodra HIBE nieuwe video's klaarzet, verschijnen ze hier."}</p>
        <Button asChild className="w-full"><Link to={`${base}/videos`}>Terug naar het overzicht</Link></Button>
      </div>
    );
  }
  return <ReviewOne key={current} itemId={current!} pos={flow ? { i: idx, n: queue.length } : null} readOnly={isAdmin}
    onPrev={() => setIdx((i) => Math.max(0, i - 1))} onNext={() => setIdx((i) => i + 1)}
    onDone={(r) => { setResults((s) => ({ ...s, [current!]: r })); qc.invalidateQueries({ queryKey: ["video-items"] }); flow ? setIdx((i) => i + 1) : nav(`${base}/videos`); }} />;
}

function ReviewOne({ itemId, pos, readOnly, onPrev, onNext, onDone }: { itemId: string; pos: { i: number; n: number } | null; readOnly: boolean; onPrev: () => void; onNext: () => void; onDone: (r: "approved" | "changes") => void }) {
  const base = useBase();
  const qc = useQueryClient();
  const { data, isLoading } = useVideoItem(itemId);
  const item = data?.item; const versions = data?.versions ?? [];
  const version = versions.find((v) => v.version === item?.current_version) ?? versions[versions.length - 1];
  const { data: url } = usePlayUrl(version?.id);
  const { data: all = [] } = useItemComments(itemId);
  const mine = all.filter((c) => !c.internal && c.version_id === version?.id);
  const player = useRef<PlayerHandle>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState(""); const [stamp, setStamp] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const canAct = !readOnly && item?.status === "client_review";

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Laden…</div>;
  if (!item) return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-6 pt-16 text-center">
      <PageHeader title="Video's" /><Lock className="h-8 w-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Geen toegang</h1><p className="text-sm text-muted-foreground">Deze video hoort niet bij jouw account of is niet meer beschikbaar.</p>
      <Button asChild><Link to={`${base}/videos`}>Naar mijn video's</Link></Button>
    </div>
  );

  const ask = () => { player.current?.pause(); setAsking(true); setStamp(player.current?.time() ?? 0); setTimeout(() => box.current?.focus(), 0); };
  const post = async () => {
    if (!text.trim() || !version) return;
    const { error } = await db.from("video_comments").insert({ item_id: item.id, version_id: version.id, time_seconds: Math.round((stamp ?? player.current?.time() ?? 0) * 100) / 100, text: text.trim(), internal: false });
    if (error) return toast.error(error.message);
    setText(""); setStamp(null); qc.invalidateQueries({ queryKey: ["video-comments"] });
  };
  const action = async (a: "approve" | "feedback") => {
    setBusy(true);
    const { error } = await db.rpc("video_client_action", { _item_id: item.id, _action: a });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(a === "approve" ? "Goedgekeurd" : "Wijzigingen verstuurd");
    onDone(a === "approve" ? "approved" : "changes");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <PageHeader title="Beoordelen" />
      {pos && (
        <div className="flex items-center gap-3">
          <button aria-label="Vorige video" disabled={pos.i === 0} onClick={onPrev} className="round-btn h-9 w-9 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <div className="flex-1 space-y-1"><p className="text-sm font-medium">Video {pos.i + 1} van {pos.n}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-lime transition-[width]" style={{ width: `${((pos.i + 1) / pos.n) * 100}%` }} /></div></div>
          <button aria-label="Volgende video" disabled={pos.i >= pos.n - 1} onClick={onNext} className="round-btn h-9 w-9 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
      <h1 className="truncate text-lg font-semibold">{item.title}</h1>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <Player ref={player} url={url} maxH="min(70vh, calc(100vh - 300px))" markers={mine.map((c) => ({ id: c.id, t: c.time_seconds, label: String(c.number) }))} />
          {canAct && (
            <div className="sticky bottom-20 z-10 grid grid-cols-2 gap-2 bg-background py-2 md:bottom-0">
              <Button size="lg" className="h-12 bg-lime text-base text-lime-foreground hover:bg-lime/90" disabled={busy} onClick={() => action("approve")}><Check />Goedkeuren</Button>
              <Button size="lg" variant={asking ? "outline" : "default"} className="h-12 text-base" disabled={busy} onClick={ask}><MessageSquare />Wijziging vragen</Button>
            </div>
          )}
          {!canAct && item.status !== "client_review" && <p className="rounded-md bg-muted p-3 text-sm">{item.status === "feedback" ? "Je hebt wijzigingen gevraagd. HIBE is ermee bezig." : "Deze video is goedgekeurd."}</p>}
        </div>
        <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Jouw opmerkingen <span className="text-muted-foreground tabular">{mine.length}</span></h2>
          {mine.length === 0 ? <p className="text-sm text-muted-foreground">{canAct ? "Iets aanpassen? Klik op Wijziging vragen; de video pauzeert op dat moment." : "Geen opmerkingen bij deze versie."}</p> : (
            <ol className="space-y-2">
              {mine.map((c) => (
                <li key={c.id}><button onClick={() => player.current?.seek(c.time_seconds)} className="w-full rounded-md border border-border bg-background p-2.5 text-left">
                  <span className="chip tabular">{fmtTime(c.time_seconds)}</span>{c.resolved && <span className="ml-2 text-xs text-muted-foreground">Verwerkt</span>}
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.text}</p></button></li>
              ))}
            </ol>
          )}
          {canAct && (asking || mine.length > 0) && (
            <form className="mt-auto space-y-2" onSubmit={(e) => { e.preventDefault(); post(); }}>
              <span className="chip tabular">{fmtTime(stamp ?? 0)}</span>
              <Textarea ref={box} value={text} onFocus={() => { if (stamp === null) { player.current?.pause(); setStamp(player.current?.time() ?? 0); } }} onChange={(e) => setText(e.target.value)} placeholder="Wat moet er anders?" aria-label="Opmerking" maxLength={4000} className="min-h-20" />
              <Button type="submit" variant="outline" className="w-full" disabled={!text.trim()}>Opmerking plaatsen</Button>
              <Button type="button" className={cn("w-full")} disabled={busy || mine.length === 0} onClick={() => action("feedback")}>Verstuur wijzigingen{mine.length ? ` (${mine.length})` : ""}</Button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
