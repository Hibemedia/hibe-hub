import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, MessageSquare, MoreHorizontal, Search, Send, Trash2, RotateCcw } from "lucide-react";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { useMedia, useSavedFilters, useUploader } from "@/components/videos/useMedia";
import { VideoThumb } from "@/components/videos/parts";
import { useSendToClient, copyText, portalLink } from "@/components/videos/SendDialog";
import { UploadProgress } from "@/components/UploadProgress";
import { EmptyState } from "@/components/StatsOverview";
import { BoardItem, setVideoStatus, renameVideo, trashVideo } from "@/hooks/useVideos";
import { invokeVideo, forgetResume } from "@/lib/r2Upload";
import { startUpload } from "@/lib/uploadStore";
import { STEPS, STEP_HINT, STEP_ACTION, VIDEO_STATUS_LABEL, VideoStatus, statusFromSlug, ageTone, fmtSize } from "@/lib/videos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MEDIA_SUB } from "@/components/AppSidebar";
import { toast } from "sonner";

const ALL: VideoStatus[] = [...STEPS, "archived"];
const toneCls = { ok: "text-muted-foreground", warn: "text-warning font-medium", late: "text-destructive font-medium" };
const fmtDate = (d: string) => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
const typeOf = (m: string | null, n: string | null) => (m?.split("/")[1] ?? n?.split(".").pop() ?? "").toUpperCase();

export async function downloadVideo(versionId: string | null, name: string) {
  if (!versionId) return toast.error("Nog geen versie beschikbaar");
  try { const { url } = await invokeVideo<{ url: string }>({ action: "play_url", version_id: versionId }); const a = document.createElement("a"); a.href = url; a.download = name; a.target = "_blank"; a.click(); }
  catch (e: any) { toast.error(e.message); }
}

export default function MediaStep() {
  const { step } = useParams();
  const trashView = step === "prullenbak";
  const status = statusFromSlug(step);
  const nav = useNavigate();
  const qc = useQueryClient();
  const m = useMedia(status === "archived" || trashView);
  const [f, setF] = useSavedFilters();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const up = useUploader(f.client !== "all" ? f.client : undefined);
  const sender = useSendToClient();
  const verInput = useRef<HTMLInputElement>(null);
  const [verFor, setVerFor] = useState<BoardItem | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["video-items"] });

  const base = trashView ? m.trash : m.live.filter((i) => i.status === status);
  const uploaders = useMemo(() => [...new Set(base.map((i) => i.uploader).filter(Boolean) as string[])], [base]);
  const list = base.filter((i) => (f.client === "all" || i.client_id === f.client) && (f.uploader === "all" || i.uploader === f.uploader) && (!f.q || i.title.toLowerCase().includes(f.q.toLowerCase())));
  const ready = status === "ready_for_client" ? [...new Set(m.live.filter((i) => i.status === "ready_for_client").map((i) => i.client_id))] : [];

  const move = async (ids: string[], to: VideoStatus) => {
    try { for (const id of ids) await setVideoStatus(id, to); toast.success(`${ids.length > 1 ? `${ids.length} video's` : "Video"} naar ${VIDEO_STATUS_LABEL[to]}`); } catch (e: any) { toast.error(e.message); }
    setSel(new Set()); refresh();
  };
  const act = (i: BoardItem) => {
    const a = status ? STEP_ACTION[status] : undefined; if (!a) return;
    if (a.kind === "review") nav(`/hibe/videos/${i.id}`);
    else if (a.kind === "new_version") { setVerFor(i); verInput.current?.click(); }
    else if (a.kind === "move" && a.to) move([i.id], a.to);
    else if (a.kind === "remind") copyText(`Hoi ${m.clientName(i.client_id)}! Een herinnering: "${i.title}" wacht nog op je beoordeling. ${portalLink()}`);
  };
  const rename = async (i: BoardItem) => { const t = window.prompt("Nieuwe titel", i.title)?.trim(); if (!t || t === i.title) return; try { await renameVideo(i.id, t); refresh(); } catch (e: any) { toast.error(e.message); } };
  const trash = async (i: BoardItem, on: boolean) => { try { await trashVideo(i.id, on); toast.success(on ? "Naar prullenbak" : "Teruggezet"); refresh(); } catch (e: any) { toast.error(e.message); } };
  const destroy = async (i: BoardItem) => { if (!window.confirm(`"${i.title}" definitief verwijderen, ook uit de opslag?`)) return; try { await invokeVideo({ action: "delete_item", item_id: i.id }); forgetResume(i.id); refresh(); } catch (e: any) { toast.error(e.message); } };

  if (!status && !trashView) return <div className="p-8"><EmptyState text="Deze stap bestaat niet." /></div>;
  const title = trashView ? "Prullenbak" : status === "archived" ? "Archief" : VIDEO_STATUS_LABEL[status!];
  const hint = trashView ? "Verwijderde video's. Zet ze terug of verwijder ze definitief." : STEP_HINT[status!];
  const all = list.length > 0 && list.every((i) => sel.has(i.id));

  return (
    <div className="space-y-4 p-4 md:p-8" {...up.dropProps}>
      <PageHeader title={title} action={<PrimaryAction icon={Upload} onClick={up.openPicker}>Video uploaden</PrimaryAction>} />
      <Select value={trashView ? "/hibe/videos/stap/prullenbak" : `/hibe/videos/stap/${step}`} onValueChange={(v) => nav(v)}>
        <SelectTrigger aria-label="Kies stap" className="md:hidden"><SelectValue /></SelectTrigger>
        <SelectContent>{MEDIA_SUB.map((s) => <SelectItem key={s.url} value={s.url}>{s.title}</SelectItem>)}</SelectContent>
      </Select>
      <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{hint}</p></div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={f.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Zoek op titel" aria-label="Zoek op titel" className="h-9 w-56 pl-8" /></div>
        <Select value={f.client} onValueChange={(v) => setF({ client: v })}><SelectTrigger aria-label="Filter op klant" className="h-9 w-auto min-w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle klanten</SelectItem>{m.clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={f.uploader} onValueChange={(v) => setF({ uploader: v })}><SelectTrigger aria-label="Filter op uploader" className="h-9 w-auto min-w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle uploaders</SelectItem>{(f.uploader !== "all" && !uploaders.includes(f.uploader) ? [...uploaders, f.uploader] : uploaders).map((u) => <SelectItem key={u} value={u}>{m.names[u] ?? "Onbekend"}</SelectItem>)}</SelectContent></Select>
        {sel.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm">{sel.size} geselecteerd</span>
            <Select onValueChange={(v) => move([...sel], v as VideoStatus)}><SelectTrigger aria-label="Verplaats selectie" className="h-9 w-auto min-w-44"><SelectValue placeholder="Verplaats naar…" /></SelectTrigger>
              <SelectContent>{ALL.filter((s) => s !== status).map((s) => <SelectItem key={s} value={s}>{VIDEO_STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select>
          </div>
        )}
      </div>

      {ready.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ready.map((cid) => { const batch = m.live.filter((i) => i.status === "ready_for_client" && i.client_id === cid); return (
            <div key={cid} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
              {m.mark(cid, 24)}<span className="text-sm font-medium">{m.clientName(cid)}</span>
              <Button size="sm" disabled={sender.busy} onClick={() => sender.send(m.clientName(cid), batch)}><Send />Stuur {batch.length} naar klant</Button>
            </div>); })}
        </div>
      )}
      <UploadProgress />

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        {m.isLoading ? <EmptyState text="Laden…" /> : list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            {status === "internal_review" ? "Niets te beoordelen. Zodra er een video is geüpload, verschijnt hij hier." : trashView ? "De prullenbak is leeg." : "Geen video's in deze stap."}
            {status === "internal_review" && <Button onClick={up.openPicker}><Upload />Video uploaden</Button>}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            <li className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
              <Checkbox checked={all} onCheckedChange={(v) => setSel(v ? new Set(list.map((i) => i.id)) : new Set())} aria-label="Alles selecteren" />
              <span>{list.length} video{list.length === 1 ? "" : "'s"} · nieuwste bovenaan</span>
            </li>
            {list.map((i) => {
              const a = status && !trashView ? STEP_ACTION[status] : undefined;
              return (
                <li key={i.id} onClick={() => nav(`/hibe/videos/${i.id}`)} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/50">
                  <span onClick={(e) => e.stopPropagation()}><Checkbox checked={sel.has(i.id)} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); v ? n.add(i.id) : n.delete(i.id); return n; })} aria-label={`Selecteer ${i.title}`} /></span>
                  {m.mark(i.client_id, 24)}
                  <VideoThumb versionId={i.versionId} className="h-12 w-[27px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.title} <span className="text-muted-foreground">V{i.current_version}</span></p>
                    <p className="truncate text-xs text-muted-foreground">{m.clientName(i.client_id)}{i.file_name ? ` · ${typeOf(i.mime_type, i.file_name)}` : ""}{i.size_bytes ? ` · ${fmtSize(i.size_bytes)}` : ""}</p>
                  </div>
                  <span className={cn("hidden w-12 items-center gap-1 text-sm sm:flex", i.openComments ? "" : "text-muted-foreground/50")} title="Open opmerkingen"><MessageSquare className="h-4 w-4" />{i.openComments || ""}</span>
                  <span className={cn("hidden w-16 text-sm tabular sm:block", toneCls[ageTone(i.status_changed_at)])} title="In deze stap sinds">{fmtDate(i.status_changed_at)}</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {trashView ? <Button size="sm" variant="outline" onClick={() => trash(i, false)}><RotateCcw />Terugzetten</Button>
                      : <>{status === "approved_internal" && <Button size="sm" variant="outline" onClick={() => downloadVideo(i.versionId, i.file_name ?? i.title)}>Download</Button>}{a && <Button size="sm" variant={a.kind === "review" ? "default" : "outline"} onClick={() => act(i)}>{a.label}</Button>}</>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button aria-label="Meer acties" className="round-btn h-8 w-8"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!trashView && <DropdownMenuSub><DropdownMenuSubTrigger>Verplaats naar</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>{ALL.filter((s) => s !== i.status).map((s) => <DropdownMenuItem key={s} onClick={() => move([i.id], s)}>{s === "archived" ? "Archief" : VIDEO_STATUS_LABEL[s]}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub>}
                        <DropdownMenuItem onClick={() => downloadVideo(i.versionId, i.file_name ?? i.title)}>Download</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => rename(i)}>Hernoem</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {trashView ? <DropdownMenuItem className="text-destructive" onClick={() => destroy(i)}><Trash2 />Definitief verwijderen</DropdownMenuItem>
                          : <DropdownMenuItem onClick={() => trash(i, true)}><Trash2 />Naar prullenbak</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <input ref={verInput} type="file" accept="video/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]; e.target.value = "";
        if (file && verFor) startUpload({ file, itemId: verFor.id, onDone: () => { refresh(); toast.success(`V${verFor.current_version + 1} van ${verFor.title} staat in ${verFor.status === "approved_internal" ? "Mag naar klant" : "Interne controle"}`); } });
      }} />
      {up.ui}{sender.dialog}
    </div>
  );
}
