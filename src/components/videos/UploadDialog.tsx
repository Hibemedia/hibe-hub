import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { startUpload } from "@/lib/uploadStore";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function validVideos(files: FileList | File[]) {
  const out: File[] = [];
  for (const f of Array.from(files)) {
    if (!f.type.startsWith("video/")) { toast.error(`${f.name} is geen videobestand`); continue; }
    if (f.size > 5 * 1024 ** 3) { toast.error(`${f.name} is groter dan 5 GB`); continue; }
    out.push(f);
  }
  return out;
}

/** Bulk upload: drop many files, then pick a client per video (or one for all); uploads keep running in the background. */
export function UploadDialog({ files, open, onOpenChange, defaultClient, onPick }: { files: File[]; open: boolean; onOpenChange: (o: boolean) => void; defaultClient?: string; onPick: (f: File[]) => void }) {
  const { clients } = useClient();
  const qc = useQueryClient();
  const [rows, setRows] = useState<{ title: string; client: string }[]>([]);
  const [over, setOver] = useState(false);
  useEffect(() => {
    setRows((old) => files.map((f, i) => old[i] ?? { title: f.name.replace(/\.[^.]+$/, ""), client: defaultClient ?? "" }));
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!open) setRows([]); }, [open]);
  const set = (i: number, p: Partial<{ title: string; client: string }>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const add = (list: FileList) => { const v = validVideos(list); if (v.length) onPick([...files, ...v]); };
  const ready = files.length > 0 && rows.length === files.length && rows.every((r) => r.client && r.title.trim());
  const missing = rows.filter((r) => !r.client).length;
  const go = () => {
    files.forEach((f, i) => { const r = rows[i]; startUpload({ file: f, clientId: r.client, title: r.title.trim() || f.name, onDone: () => { qc.invalidateQueries({ queryKey: ["video-items"] }); toast.success(`${r.title} staat in Interne controle`); } }); });
    onOpenChange(false);
  };
  const ClientSelect = ({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder: string }) => (
    <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full sm:w-48"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Video's uploaden{files.length > 1 ? ` (${files.length})` : ""}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <label
            onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); add(e.dataTransfer.files); }}
            className={`flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted ${files.length ? "h-14" : "h-28"} ${over ? "bg-muted" : ""}`}>
            {files.length ? "Sleep of kies nog meer video's" : "Sleep video's hierheen of klik om te kiezen"}
            <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
          </label>
          {files.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
              <span className="text-sm text-muted-foreground">Zelfde klant voor alles</span>
              <ClientSelect value="" label="Klant voor alle video's" placeholder="Kies voor alle" onChange={(v) => setRows((r) => r.map((x) => ({ ...x, client: v })))} />
            </div>
          )}
          {files.length > 0 && (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {files.map((f, i) => (
                <li key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input className="min-w-0 flex-1" aria-label={`Titel voor ${f.name}`} value={rows[i]?.title ?? ""} onChange={(e) => set(i, { title: e.target.value })} />
                  <div className="flex items-center gap-2">
                    <ClientSelect value={rows[i]?.client ?? ""} label={`Klant voor ${f.name}`} placeholder="Kies klant" onChange={(v) => set(i, { client: v })} />
                    <button aria-label="Verwijderen" onClick={() => { setRows((r) => r.filter((_, j) => j !== i)); onPick(files.filter((_, j) => j !== i)); }} className="round-btn h-8 w-8 shrink-0"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="items-center gap-2">
          {missing > 0 && <span className="text-sm text-muted-foreground">Nog {missing} zonder klant</span>}
          <Button disabled={!ready} onClick={go}>Uploaden{files.length > 1 ? ` (${files.length})` : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
