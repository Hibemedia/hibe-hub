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

/** Pick client + one title per file; uploads keep running in the background. */
export function UploadDialog({ files, open, onOpenChange, defaultClient, onPick }: { files: File[]; open: boolean; onOpenChange: (o: boolean) => void; defaultClient?: string; onPick: (f: File[]) => void }) {
  const { clients } = useClient();
  const qc = useQueryClient();
  const [client, setClient] = useState(defaultClient ?? "");
  const [titles, setTitles] = useState<string[]>([]);
  useEffect(() => { if (open) { setClient(defaultClient ?? ""); setTitles(files.map((f) => f.name.replace(/\.[^.]+$/, ""))); } }, [open, files]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = () => {
    files.forEach((f, i) => startUpload({ file: f, clientId: client, title: titles[i]?.trim() || f.name, onDone: () => { qc.invalidateQueries({ queryKey: ["video-items"] }); toast.success(`${titles[i]} staat in Interne controle`); } }));
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Video uploaden</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Klant</Label>
            <Select value={client} onValueChange={setClient}><SelectTrigger aria-label="Klant"><SelectValue placeholder="Kies een klant" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          {files.length === 0 ? (
            <label className="flex h-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted">
              Kies een of meer videobestanden
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => { if (e.target.files) onPick(validVideos(e.target.files)); e.target.value = ""; }} />
            </label>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Input aria-label={`Titel voor ${f.name}`} value={titles[i] ?? ""} onChange={(e) => setTitles((t) => t.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button aria-label="Verwijderen" onClick={() => onPick(files.filter((_, j) => j !== i))} className="round-btn h-8 w-8 shrink-0"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter><Button disabled={!client || !files.length || titles.some((t) => !t.trim())} onClick={go}>Uploaden{files.length > 1 ? ` (${files.length})` : ""}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
