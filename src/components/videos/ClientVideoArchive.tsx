import { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Download, Loader2, Search } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useBase } from "@/lib/paths";
import { clientArchive } from "@/lib/videos";
import { getDownloadUrl, useVideoBoard } from "@/hooks/useVideos";
import { VideoThumb } from "@/components/videos/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ClientVideoArchive() {
  const { clientId } = useClient();
  const base = useBase();
  const { data = [], isLoading, isError } = useVideoBoard({ includeDone: true });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const archived = clientArchive(data, clientId).sort((a, b) => b.status_changed_at.localeCompare(a.status_changed_at));
  const shown = archived.filter((item) => item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const download = async (versionId: string) => {
    setBusy(versionId);
    try {
      const link = document.createElement("a");
      link.href = await getDownloadUrl(versionId);
      link.click();
    } catch {
      toast.error("Downloaden mislukt. Probeer het opnieuw.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="min-w-0 space-y-3" aria-label="Videoarchief">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold"><Archive className="h-4 w-4 shrink-0" /><span className="truncate">Videoarchief</span><span className="tabular text-muted-foreground">{archived.length}</span></h2>
        {archived.length > 0 && <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Zoek in videoarchief" placeholder="Zoek op videotitel" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>}
      </div>
      {isLoading || isError || shown.length === 0 ? <p className="text-sm text-muted-foreground">{isLoading ? "Laden…" : isError ? "Het videoarchief kon niet worden geladen." : archived.length ? "Geen video's gevonden." : "Nog geen gearchiveerde video's."}</p> : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {shown.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <Link to={`${base}/videos/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <VideoThumb versionId={item.versionId} className="h-14 w-8" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.title}</span><span className="text-xs text-muted-foreground">Versie {item.current_version} · {new Date(item.status_changed_at).toLocaleDateString("nl-NL")}</span></span>
              </Link>
              <Button variant="outline" size="icon" className="shrink-0" aria-label={`Download ${item.title}`} title={`Download ${item.title}`} disabled={!item.versionId || busy !== null} onClick={() => { if (item.versionId) void download(item.versionId); }}>
                {busy === item.versionId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}