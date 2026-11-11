import { X, RotateCw } from "lucide-react";
import { useUploads, dismissUpload } from "@/lib/uploadStore";

export function UploadProgress() {
  const jobs = useUploads();
  if (!jobs.length) return null;
  return (
    <section className="space-y-3 rounded-lg bg-card p-4" aria-label="Uploads">
      {jobs.map((j) => (
        <div key={j.id} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{j.name}</span>
            <span className="flex shrink-0 items-center gap-2 tabular text-muted-foreground">
              {j.state === "error" ? <span className="text-destructive">{j.error}</span> : j.state === "done" ? "Klaar" : `${Math.round(j.progress * 100)}%`}
              {j.state === "uploading"
                ? <button aria-label="Upload annuleren" onClick={() => j.abort.abort()} className="round-btn h-7 w-7"><X className="h-3.5 w-3.5" /></button>
                : <button aria-label="Sluiten" onClick={() => dismissUpload(j.id)} className="round-btn h-7 w-7"><X className="h-3.5 w-3.5" /></button>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-lime transition-[width]" style={{ width: `${j.progress * 100}%` }} /></div>
          {j.state === "error" && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><RotateCw className="h-3 w-3" />Sleep hetzelfde bestand opnieuw met dezelfde klant en titel; de upload gaat verder waar hij stopte.</p>}
        </div>
      ))}
    </section>
  );
}
