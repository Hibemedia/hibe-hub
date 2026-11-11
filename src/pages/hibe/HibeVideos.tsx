import { useRef, useState, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, ArrowUpRight, Bell } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useVideoItems, setVideoStatus, VideoItem } from "@/hooks/useVideos";
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL, VideoStatus, clientsReadyToSend, READY_THRESHOLD } from "@/lib/videos";
import { startUpload } from "@/lib/uploadStore";
import { UploadProgress } from "@/components/UploadProgress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function HibeVideos() {
  const { clients } = useClient();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [client, setClient] = useState("all");
  const { data: items = [], isLoading } = useVideoItems();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<VideoStatus | null>(null);
  const [fileOver, setFileOver] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [form, setForm] = useState({ client: "", title: "" });
  const input = useRef<HTMLInputElement>(null);
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  const list = items.filter((i) => client === "all" || i.client_id === client);
  const ready = clientsReadyToSend(items);
  const refresh = () => qc.invalidateQueries({ queryKey: ["video-items"] });

  const move = async (item: VideoItem, status: VideoStatus) => {
    if (item.status === status) return;
    qc.setQueryData<VideoItem[]>(["video-items", "all"], (old) => old?.map((i) => (i.id === item.id ? { ...i, status } : i)));
    try {
      await setVideoStatus(item.id, status);
      if (status === "ready_for_client") {
        const n = items.filter((i) => i.client_id === item.client_id && i.status === "ready_for_client" && i.id !== item.id).length + 1;
        if (n === READY_THRESHOLD) toast(`${name(item.client_id)}: ${n} video's staan klaar om naar de klant te gaan`);
      }
    } catch (e: any) { toast.error(e.message ?? "Status wijzigen mislukt"); }
    refresh();
  };

  const pickFile = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Dit is geen videobestand"); return; }
    if (f.size > 5 * 1024 ** 3) { toast.error("Bestand is groter dan 5 GB"); return; }
    setForm({ client: client !== "all" ? client : "", title: f.name.replace(/\.[^.]+$/, "") });
    setPending(f);
  };
  const onFileDrop = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault(); setFileOver(false); pickFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-8"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setFileOver(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setFileOver(false); }}
      onDrop={onFileDrop}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="wordmark">Video's</h1>
        <button onClick={() => input.current?.click()} className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-2 pr-5 text-sm font-medium text-background">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><Upload className="h-4 w-4" /></span>Video uploaden
        </button>
        <input ref={input} type="file" accept="video/*" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger aria-label="Filter op klant" className="h-9 w-auto min-w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle klanten</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">Sleep een videobestand op deze pagina om te uploaden.</span>
      </div>

      {ready.map((r) => (
        <div key={r.client_id} role="status" className="flex flex-wrap items-center gap-3 rounded-lg bg-foreground px-5 py-3 text-background">
          <Bell className="h-4 w-4" />
          <span className="text-sm"><b>{name(r.client_id)}</b>: {r.count} video's staan klaar in "Mag naar klant".</span>
          <button onClick={() => setClient(r.client_id)} className="ml-auto rounded-full bg-lime px-4 py-1.5 text-sm font-medium text-lime-foreground">Bekijk</button>
        </div>
      ))}

      <UploadProgress />

      {fileOver && <div className="pointer-events-none fixed inset-4 z-40 flex items-center justify-center rounded-lg border-2 border-dashed border-foreground bg-background/80 text-xl font-semibold">Laat los om te uploaden</div>}

      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        <div className="flex gap-3">
          {VIDEO_STATUSES.map((s) => {
            const col = list.filter((i) => i.status === s);
            return (
              <section key={s} aria-label={VIDEO_STATUS_LABEL[s]}
                onDragOver={(e) => { if (dragId) { e.preventDefault(); setOver(s); } }}
                onDragLeave={() => setOver((o) => (o === s ? null : o))}
                onDrop={(e) => { if (!dragId) return; e.preventDefault(); e.stopPropagation(); const it = items.find((i) => i.id === dragId); setDragId(null); setOver(null); if (it) move(it, s); }}
                className={`flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-card p-3 transition-colors ${over === s ? "bg-popover outline outline-2 outline-foreground" : ""}`}>
                <header className="flex items-center justify-between px-1 py-1">
                  <h2 className="text-sm font-semibold">{VIDEO_STATUS_LABEL[s]}</h2>
                  <span className="chip tabular">{col.length}</span>
                </header>
                {isLoading ? <p className="px-1 text-sm text-muted-foreground">Laden…</p> : col.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Leeg</p>}
                {col.map((i) => (
                  <article key={i.id} draggable onDragStart={(e) => { setDragId(i.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDragId(null); setOver(null); }}
                    className={`group cursor-grab rounded-lg bg-background p-3 active:cursor-grabbing ${dragId === i.id ? "opacity-50" : ""}`}>
                    <div className="mb-2 flex flex-wrap gap-1.5"><span className="chip">{name(i.client_id)}</span>{i.current_version > 0 ? <span className="chip">V{i.current_version}</span> : <span className="chip">Uploaden…</span>}</div>
                    <button onClick={() => nav(`/hibe/videos/${i.id}`)} className="flex w-full items-start justify-between gap-2 text-left">
                      <span className="line-clamp-2 font-semibold leading-snug">{i.title}</span>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    </button>
                    <Select value={i.status} onValueChange={(v) => move(i, v as VideoStatus)}>
                      <SelectTrigger aria-label={`Status van ${i.title}`} className="mt-3 h-8 rounded-full text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{VIDEO_STATUSES.map((x) => <SelectItem key={x} value={x}>{VIDEO_STATUS_LABEL[x]}</SelectItem>)}</SelectContent>
                    </Select>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </div>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Video uploaden</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (!pending || !form.client || !form.title.trim()) return;
            startUpload({ file: pending, clientId: form.client, title: form.title.trim(), onDone: () => { refresh(); toast.success("Upload klaar"); } });
            setTimeout(refresh, 1500);
            setPending(null);
          }}>
            <p className="truncate text-sm text-muted-foreground">{pending?.name}</p>
            <div className="space-y-1.5"><Label>Klant</Label>
              <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                <SelectTrigger aria-label="Klant"><SelectValue placeholder="Kies een klant" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="vt">Titel</Label><Input id="vt" value={form.title} maxLength={300} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <Button type="submit" className="w-full rounded-full" disabled={!form.client || !form.title.trim()}>Uploaden</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
