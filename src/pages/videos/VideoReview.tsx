import { PageHeader } from "@/components/PageHeader";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, MessageSquare, Upload, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useBase } from "@/lib/paths";
import { useVideoItem, useVideoComments, usePlayUrl, setVideoStatus } from "@/hooks/useVideos";
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL, VideoStatus, fmtTime, fmtSize, hibeNext } from "@/lib/videos";
import { invokeVideo, forgetResume } from "@/lib/r2Upload";
import { startUpload } from "@/lib/uploadStore";
import { UploadProgress } from "@/components/UploadProgress";
import { EmptyState } from "@/components/StatsOverview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const db = supabase as any;

export default function VideoReview() {
  const { id } = useParams();
  const { isAdmin, clients } = useClient();
  const base = useBase();
  const nav = useNavigate();
  const qc = useQueryClient();
  const hibeBoard = isAdmin && !base;
  const back = hibeBoard ? "/hibe/videos" : `${base}/videos`;
  const { data, isLoading } = useVideoItem(id);
  const item = data?.item; const versions = data?.versions ?? [];
  const [verNo, setVerNo] = useState<number | null>(null);
  const version = versions.find((v) => v.version === (verNo ?? item?.current_version)) ?? versions[versions.length - 1];
  const { data: url } = usePlayUrl(version?.id);
  const { data: comments = [] } = useVideoComments(version?.id);
  const video = useRef<HTMLVideoElement>(null);
  const [dur, setDur] = useState(0);
  const [now, setNow] = useState(0);
  const [text, setText] = useState("");
  const [stamp, setStamp] = useState<number | null>(null);
  const [internal, setInternal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { setVerNo(null); }, [item?.current_version]);

  const reload = () => { qc.invalidateQueries({ queryKey: ["video-item", id] }); qc.invalidateQueries({ queryKey: ["video-items"] }); };
  const reloadComments = () => qc.invalidateQueries({ queryKey: ["video-comments", version?.id] });
  const seek = (t: number) => { const v = video.current; if (v) { v.currentTime = t; v.pause(); } };

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Laden…</div>;
  if (!item) return <div className="mx-auto max-w-3xl p-8"><section className="rounded-lg bg-card"><EmptyState text="Deze video is niet (meer) beschikbaar." /></section></div>;

  const isCurrent = version?.version === item.current_version;
  const clientCanAct = !isAdmin && item.status === "client_review" && isCurrent;
  const canComment = isAdmin || clientCanAct;
  const clientName = clients.find((c) => c.id === item.client_id)?.name;

  const startTyping = (v: string) => {
    if (stamp === null && v.trim()) { const vid = video.current; setStamp(vid?.currentTime ?? 0); vid?.pause(); }
    if (!v.trim()) setStamp(null);
    setText(v);
  };
  const send = async () => {
    if (!text.trim() || !version) return;
    setBusy(true);
    const { error } = await db.from("video_comments").insert({ item_id: item.id, version_id: version.id, time_seconds: Math.round((stamp ?? 0) * 100) / 100, text: text.trim(), internal: isAdmin ? internal : false });
    setBusy(false);
    if (error) return toast.error(error.message);
    setText(""); setStamp(null); reloadComments();
  };
  const resolve = async (cid: string, resolved: boolean) => {
    const { error } = await db.from("video_comments").update({ resolved }).eq("id", cid);
    if (error) toast.error(error.message); else reloadComments();
  };
  const act = async (action: "approve" | "feedback") => {
    setBusy(true);
    try {
      if (isAdmin) {
        const next = hibeNext(item.status, action);
        if (next) await setVideoStatus(item.id, next);
      } else {
        const { error } = await db.rpc("video_client_action", { _item_id: item.id, _action: action });
        if (error) throw error;
      }
      toast.success(action === "approve" ? "Goedgekeurd" : "Feedback verstuurd");
      reload();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };
  const changeStatus = async (s: VideoStatus) => { try { await setVideoStatus(item.id, s); reload(); } catch (e: any) { toast.error(e.message); } };
  const newVersion = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) return toast.error("Dit is geen videobestand");
    startUpload({ file: f, itemId: item.id, onDone: () => { reload(); toast.success(`V${item.current_version + 1} staat klaar`); } });
  };
  const del = async () => {
    try { await invokeVideo({ action: "delete_item", item_id: item.id }); forgetResume(item.id); qc.invalidateQueries({ queryKey: ["video-items"] }); nav(back); }
    catch (e: any) { toast.error(e.message); }
  };

  const nextApprove = isAdmin ? hibeNext(item.status, "approve") : null;
  const showButtons = isAdmin ? item.status !== "archived" : clientCanAct;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <PageHeader title="Video bekijken" />
        <Link to={back} className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-popover px-3 text-sm font-medium"><ArrowLeft className="h-4 w-4" />Video's</Link>
        {isAdmin && clientName && <span className="chip">{clientName}</span>}
        <span className="chip bg-lime text-lime-foreground">{VIDEO_STATUS_LABEL[item.status]}</span>
      </div>
      <h2 className="break-words text-xl font-semibold leading-tight">{item.title}</h2>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-lg bg-foreground">
            {version && url ? (
              <video ref={video} src={url} controls playsInline preload="metadata" className="aspect-video w-full bg-foreground"
                onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)} onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)} />
            ) : <div className="flex aspect-video items-center justify-center text-sm text-background/70">{version ? "Video laden…" : "Nog geen versie geüpload"}</div>}
          </div>

          {dur > 0 && (
            <div className="relative h-8 rounded-full bg-card px-3" aria-label="Tijdlijn met opmerkingen">
              <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
              <div className="absolute left-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground" style={{ width: `calc((100% - 1.5rem) * ${Math.min(1, now / dur)})` }} />
              {comments.map((c) => (
                <button key={c.id} onClick={() => seek(c.time_seconds)} title={`${c.number}. ${fmtTime(c.time_seconds)}`} aria-label={`Opmerking ${c.number} op ${fmtTime(c.time_seconds)}`}
                  className={`absolute top-1/2 flex h-5 min-w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-1 text-[10px] font-bold ${c.resolved ? "bg-muted text-muted-foreground" : c.internal ? "bg-foreground text-background" : "bg-lime text-lime-foreground"}`}
                  style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${Math.min(1, c.time_seconds / dur)})` }}>{c.number}</button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {versions.map((v) => (
              <button key={v.id} aria-pressed={v.id === version?.id} onClick={() => setVerNo(v.version)} className="chip-filter">V{v.version}{v.version === item.current_version ? " · huidig" : ""}</button>
            ))}
            {version && <span className="text-xs text-muted-foreground">{version.file_name} {fmtSize(version.size_bytes)}</span>}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-card p-3">
              <Select value={item.status} onValueChange={(v) => changeStatus(v as VideoStatus)}>
                <SelectTrigger aria-label="Status" className="h-10 w-auto min-w-52 rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>{VIDEO_STATUSES.map((s) => <SelectItem key={s} value={s}>{VIDEO_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
              </Select>
              <button onClick={() => file.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm"><Upload className="h-4 w-4" />Nieuwe versie (V{item.current_version + 1})</button>
              <input ref={file} type="file" accept="video/*" className="hidden" onChange={(e) => { newVersion(e.target.files?.[0]); e.target.value = ""; }} />
              <button onClick={() => setConfirmDel(true)} aria-label="Video verwijderen" className="round-btn ml-auto"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
          <UploadProgress />
        </section>

        <aside className="flex min-w-0 flex-col gap-3 rounded-lg bg-card p-4">
          <h2 className="text-lg font-semibold">Opmerkingen {version ? `· V${version.version}` : ""}</h2>
          {comments.length === 0 ? <p className="text-sm text-muted-foreground">Nog geen opmerkingen bij deze versie.</p> : (
            <ol className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {comments.map((c) => (
                <li key={c.id} className={`rounded-lg bg-background p-3 ${c.resolved ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-bold text-background">{c.number}</span>
                    <button onClick={() => seek(c.time_seconds)} className="min-w-0 flex-1 text-left">
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><span className="chip tabular">{fmtTime(c.time_seconds)}</span>{c.internal && <span className="chip"><Lock className="mr-1 h-3 w-3" />Intern</span>}</span>
                      <p className={`mt-1 whitespace-pre-wrap break-words text-sm ${c.resolved ? "line-through" : ""}`}>{c.text}</p>
                    </button>
                    {isAdmin ? (
                      <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Checkbox checked={c.resolved} onCheckedChange={(v) => resolve(c.id, !!v)} aria-label={`Opmerking ${c.number} verwerkt`} />Verwerkt</label>
                    ) : c.resolved && <span className="shrink-0 text-xs text-muted-foreground">Verwerkt</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {canComment && version && (
            <form className="mt-auto space-y-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="chip tabular">{fmtTime(stamp ?? now)}</span>
                <span>{stamp === null ? "Begin met typen; de video pauzeert op dit moment." : "Opmerking hoort bij dit moment."}</span>
              </div>
              <Textarea value={text} onChange={(e) => startTyping(e.target.value)} maxLength={4000} placeholder="Typ je opmerking…" aria-label="Opmerking" className="min-h-20 rounded-lg" />
              <div className="flex items-center justify-between gap-2">
                {isAdmin ? <label className="flex items-center gap-2 text-xs"><Switch checked={internal} onCheckedChange={setInternal} />Intern (niet zichtbaar voor klant)</label> : <span />}
                <button type="submit" disabled={busy || !text.trim()} className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-40">Plaatsen</button>
              </div>
            </form>
          )}

          {showButtons && (
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
              <button disabled={busy || (isAdmin && !nextApprove)} onClick={() => act("approve")} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-lime text-sm font-semibold text-lime-foreground disabled:opacity-40"><Check className="h-4 w-4" />Goedkeuren</button>
              <button disabled={busy} onClick={() => act("feedback")} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background disabled:opacity-40"><MessageSquare className="h-4 w-4" />Feedback geven</button>
              {isAdmin && nextApprove && <p className="col-span-2 text-xs text-muted-foreground">Goedkeuren zet de video op "{VIDEO_STATUS_LABEL[nextApprove]}".</p>}
              {!isAdmin && <p className="col-span-2 text-xs text-muted-foreground">Bij feedback zet je eerst je opmerkingen bij de juiste momenten.</p>}
            </div>
          )}
        </aside>
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Video verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>"{item.title}" met alle {versions.length} versie(s) en opmerkingen wordt definitief verwijderd, ook uit de opslag.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={del}>Verwijderen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
