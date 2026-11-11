import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, PanelLeftClose, PanelLeftOpen, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { useMedia } from "@/components/videos/useMedia";
import { VideoThumb, StatusLabel } from "@/components/videos/parts";
import { Player, PlayerHandle } from "@/components/videos/Player";
import { UploadProgress } from "@/components/UploadProgress";
import { EmptyState } from "@/components/StatsOverview";
import { useVideoItem, useItemComments, usePlayUrl, setVideoStatus, VideoComment } from "@/hooks/useVideos";
import { downloadVideo } from "./MediaStep";
import { startUpload } from "@/lib/uploadStore";
import { STEP_SLUG, VIDEO_STATUS_LABEL, VideoStatus, fmtTime } from "@/lib/videos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const db = supabase as any;

export default function HibeReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const m = useMedia(true);
  const { data, isLoading } = useVideoItem(id);
  const item = data?.item; const versions = data?.versions ?? [];
  const [verNo, setVerNo] = useState<number | null>(null);
  useEffect(() => setVerNo(null), [id, item?.current_version]);
  const version = versions.find((v) => v.version === (verNo ?? item?.current_version)) ?? versions[versions.length - 1];
  const { data: url } = usePlayUrl(version?.id);
  const { data: all = [] } = useItemComments(id);
  const player = useRef<PlayerHandle>(null);
  const file = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"internal" | "client">("internal");
  const [text, setText] = useState(""); const [stamp, setStamp] = useState<number | null>(null);
  const [side, setSide] = useState(() => localStorage.getItem("hibe.review.side") !== "0");
  const [busy, setBusy] = useState(false);
  // Remember the step we came from so "back" and the left list stay put after a status change.
  const stepRef = useRef<{ id?: string; status?: VideoStatus }>({});
  if (item && stepRef.current.id !== item.id) stepRef.current = { id: item.id, status: item.status };
  const step = stepRef.current.status ?? item?.status;
  const back = step ? `/hibe/videos/stap/${STEP_SLUG[step]}` : "/hibe/videos";

  const siblings = useMemo(() => m.live.filter((i) => i.status === step && i.id !== id), [m.live, step, id]);
  const verOf = (c: VideoComment) => versions.find((v) => v.id === c.version_id)?.version ?? 0;
  const shown = all.filter((c) => c.version_id === version?.id || (!c.resolved && verOf(c) < (version?.version ?? 0)));
  const prev = all.filter((c) => verOf(c) < (version?.version ?? 0) && verOf(c) === (version?.version ?? 0) - 1);
  const list = shown.filter((c) => (tab === "internal" ? c.internal : !c.internal)).sort((a, b) => Number(a.resolved) - Number(b.resolved) || verOf(a) - verOf(b) || a.time_seconds - b.time_seconds);
  const openCount = all.filter((c) => !c.resolved).length;

  const reload = () => { qc.invalidateQueries({ queryKey: ["video-item", id] }); qc.invalidateQueries({ queryKey: ["video-items"] }); qc.invalidateQueries({ queryKey: ["video-comments"] }); };
  const typing = (v: string) => {
    if (stamp === null && v.trim()) { player.current?.pause(); setStamp(player.current?.time() ?? 0); }
    if (!v.trim()) setStamp(null);
    setText(v);
  };
  const send = async () => {
    if (!text.trim() || !version || !item) return;
    const { error } = await db.from("video_comments").insert({ item_id: item.id, version_id: version.id, time_seconds: Math.round((stamp ?? 0) * 100) / 100, text: text.trim(), internal: tab === "internal" });
    if (error) return toast.error(error.message);
    setText(""); setStamp(null); reload();
  };
  const resolve = async (c: VideoComment, v: boolean) => { const { error } = await db.from("video_comments").update({ resolved: v }).eq("id", c.id); if (error) toast.error(error.message); else reload(); };
  const decide = async (to: VideoStatus) => {
    if (!item) return; setBusy(true);
    try {
      await setVideoStatus(item.id, to);
      toast.success(to === "feedback" ? "Terug naar editor" : "Goedgekeurd (intern)");
      reload();
      const next = siblings[0];
      nav(next ? `/hibe/videos/${next.id}` : back);
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Laden…</div>;
  if (!item) return <div className="mx-auto max-w-3xl p-8"><section className="rounded-lg border border-border bg-card"><EmptyState text="Deze video is niet (meer) beschikbaar." /></section></div>;

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      <PageHeader title="Beoordelen" />
      <header className="sticky top-14 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link to={back} aria-label="Terug naar de stap" className="round-btn h-9 w-9"><ArrowLeft className="h-4 w-4" /></Link>
        {m.mark(item.client_id, 28)}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{m.clientName(item.client_id)}</p>
          <p className="flex min-w-0 items-center gap-2"><span className="truncate font-semibold">{item.title}</span><span className="text-sm text-muted-foreground">V{version?.version ?? item.current_version}</span>
            <StatusLabel status={item.status} label={VIDEO_STATUS_LABEL[item.status]} /></p>
        </div>
        <Button variant="outline" disabled={busy || openCount === 0} title={openCount === 0 ? "Plaats eerst minstens één opmerking" : undefined} onClick={() => decide("feedback")}>Terug naar editor</Button>
        <Button disabled={busy} onClick={() => decide("approved_internal")}>Goedkeuren</Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={cn("hidden shrink-0 border-r border-border bg-card lg:block", side ? "w-60" : "w-12")}>
          <div className="flex items-center justify-between p-2">
            {side && <span className="px-1 text-xs font-medium text-muted-foreground">Ook in deze stap ({siblings.length})</span>}
            <button aria-label={side ? "Lijst inklappen" : "Lijst uitklappen"} onClick={() => setSide((s) => { localStorage.setItem("hibe.review.side", s ? "0" : "1"); return !s; })} className="round-btn h-8 w-8">{side ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</button>
          </div>
          {side && (siblings.length === 0 ? <p className="px-3 text-xs text-muted-foreground">Geen andere video's in deze stap.</p> : (
            <ul className="space-y-1 overflow-y-auto px-2 pb-4">
              {siblings.map((s) => (
                <li key={s.id}><Link to={`/hibe/videos/${s.id}`} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted">
                  <VideoThumb versionId={s.versionId} className="h-12 w-[27px]" logo={m.mark(s.client_id, 16)} />
                  <span className="min-w-0"><span className="line-clamp-2 text-xs font-medium">{s.title}</span><span className="text-[11px] text-muted-foreground">{m.clientName(s.client_id)}</span></span>
                </Link></li>
              ))}
            </ul>
          ))}
        </aside>

        <main className="min-w-0 flex-1 space-y-3 p-4">
          <Player ref={player} url={url} markers={shown.map((c) => ({ id: c.id, t: c.time_seconds, label: String(c.number), muted: c.resolved }))} />
          <div className="flex flex-wrap items-center justify-center gap-2">
            {versions.map((v) => <button key={v.id} aria-pressed={v.id === version?.id} onClick={() => setVerNo(v.version)} className="chip-filter h-8">V{v.version}</button>)}
            <Button variant="outline" size="sm" onClick={() => downloadVideo(version?.id ?? null, version?.file_name ?? item.title)}><Download />Download</Button>
            <Button variant="outline" size="sm" onClick={() => file.current?.click()}><Upload />Nieuwe versie</Button>
            <input ref={file} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) startUpload({ file: f, itemId: item.id, onDone: () => { reload(); toast.success(`V${item.current_version + 1} staat klaar`); } }); }} />
          </div>
          <UploadProgress />
        </main>

        <aside className="hidden w-[360px] shrink-0 flex-col border-l border-border bg-card md:flex">
          <div className="grid grid-cols-2 border-b border-border" role="tablist">
            {(["internal", "client"] as const).map((t) => {
              const n = shown.filter((c) => (t === "internal" ? c.internal : !c.internal) && !c.resolved).length;
              return <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex h-11 items-center justify-center gap-1.5 text-sm font-medium", tab === t ? "border-b-2 border-foreground" : "text-muted-foreground")}>
                {t === "internal" && <Lock className="h-3.5 w-3.5" aria-label="Niet zichtbaar voor klant" />}{t === "internal" ? "Intern" : "Klant"}<span className="chip tabular">{n}</span></button>;
            })}
          </div>
          {prev.length > 0 && <p className="border-b border-border px-4 py-2 text-xs"><b>{prev.filter((c) => c.resolved).length} van {prev.length}</b> opmerkingen uit de vorige versie verwerkt</p>}
          <ol className="flex-1 space-y-2 overflow-y-auto p-3">
            {list.length === 0 && <li className="text-sm text-muted-foreground">{tab === "internal" ? "Nog geen interne opmerkingen. Begin te typen; de video pauzeert." : "Nog geen opmerkingen van de klant."}</li>}
            {list.map((c) => (
              <li key={c.id} className={cn("rounded-md border border-border bg-background p-2.5", c.resolved && "opacity-60")}>
                <div className="flex items-start gap-2">
                  <button onClick={() => player.current?.seek(c.time_seconds)} className="min-w-0 flex-1 text-left">
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><b className="text-foreground">{m.names[c.user_id] ?? (c.internal ? "HIBE" : m.clientName(item.client_id))}</b><span className="chip tabular">{fmtTime(c.time_seconds)}</span>{verOf(c) !== version?.version && <span className="chip">V{verOf(c)}</span>}</span>
                    <p className={cn("mt-1 whitespace-pre-wrap break-words text-sm", c.resolved && "line-through")}>{c.text}</p>
                  </button>
                  <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Checkbox checked={c.resolved} onCheckedChange={(v) => resolve(c, !!v)} aria-label={`Opmerking ${c.number} verwerkt`} />verwerkt</label>
                </div>
              </li>
            ))}
          </ol>
          {version && (
            <form className="space-y-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <span className="chip tabular">{stamp === null ? "Tijdcode bij typen" : fmtTime(stamp)}</span>
              <Textarea value={text} onChange={(e) => typing(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} maxLength={4000} placeholder={tab === "internal" ? "Interne opmerking…" : "Opmerking voor de klant…"} aria-label="Opmerking" className="min-h-20" />
              <Button type="submit" className="w-full" disabled={!text.trim()}>Plaatsen{tab === "internal" ? " (intern)" : ""}</Button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
