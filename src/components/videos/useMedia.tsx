import { useEffect, useState, DragEvent } from "react";
import { useClient } from "@/context/ClientContext";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useVideoBoard, useUserNames } from "@/hooks/useVideos";
import { useClientLogos, ClientMark } from "./parts";
import { UploadDialog, validVideos } from "./UploadDialog";

/** Shared data for all HIBE Media Management pages. Trashed items are split off. */
export function useMedia(includeArchive = false) {
  const { clients } = useClient();
  const { user } = UserAuth() as any;
  const { data = [], isLoading } = useVideoBoard({ includeDone: includeArchive });
  const { data: names = {} } = useUserNames();
  const logos = useClientLogos();
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";
  const mark = (id: string, size = 24) => <ClientMark id={id} name={clientName(id)} url={logos[id]} size={size} />;
  return {
    me: (user?.id as string) ?? null, clients, isLoading, names, logos, clientName, mark,
    live: data.filter((i) => !i.archived_at), trash: data.filter((i) => !!i.archived_at),
  };
}

/** Last chosen filters, remembered per browser. */
export function useSavedFilters() {
  const KEY = "hibe.media.filters";
  const [f, setF] = useState<{ client: string; uploader: string; q: string }>(() => {
    try { return { client: "all", uploader: "all", q: "", ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return { client: "all", uploader: "all", q: "" }; }
  });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(f)); }, [f]);
  return [f, (p: Partial<typeof f>) => setF((o) => ({ ...o, ...p }))] as const;
}

/** Upload button + page-wide file drop. */
export function useUploader(defaultClient?: string) {
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const pick = (f: File[]) => { setFiles(f); setOpen(true); };
  const dropProps = {
    onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } },
    onDragLeave: (e: DragEvent) => { if (e.currentTarget === e.target) setOver(false); },
    onDrop: (e: DragEvent) => { if (!e.dataTransfer.types.includes("Files")) return; e.preventDefault(); setOver(false); const v = validVideos(e.dataTransfer.files); if (v.length) pick(v); },
  };
  const ui = (
    <>
      {over && <div className="pointer-events-none fixed inset-4 z-40 flex items-center justify-center rounded-lg border-2 border-dashed border-foreground bg-background/80 text-xl font-semibold">Laat los om te uploaden</div>}
      <UploadDialog files={files} open={open} onOpenChange={setOpen} defaultClient={defaultClient} onPick={setFiles} />
    </>
  );
  return { openPicker: () => pick([]), dropProps, ui };
}
