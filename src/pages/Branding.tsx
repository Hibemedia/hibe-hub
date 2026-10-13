import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { UserAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/StatsOverview";
import { toast } from "sonner";

const CATS = { logos: "Logo's", brandbook: "Brandbook", fotos: "Foto's", videos: "Video's", overig: "Overig" } as const;
type Cat = keyof typeof CATS;
type LibFile = { id: string; client_id: string; category: Cat; file_name: string; storage_path: string; description: string | null; mime_type: string | null; size_bytes: number | null; created_at: string };

const fmtSize = (b: number | null) => (b == null ? "" : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} kB`);
const isImg = (f: LibFile) => (f.mime_type ?? "").startsWith("image/");
const isPdf = (f: LibFile) => f.mime_type === "application/pdf";

export default function Branding() {
  const { clientId, isAdmin, ready } = useClient();
  const [cat, setCat] = useState<Cat | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ f: LibFile; url: string } | null>(null);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["library", clientId], enabled: ready && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("library_files").select("*").eq("client_id", clientId!).order("created_at", { ascending: false });
      if (error) throw error;
      const files = (data ?? []) as LibFile[];
      const thumbs = files.filter(isImg);
      const urls: Record<string, string> = {};
      if (thumbs.length) {
        const { data: s } = await supabase.storage.from("library").createSignedUrls(thumbs.map((f) => f.storage_path), 3600);
        thumbs.forEach((f, i) => { if (s?.[i]?.signedUrl) urls[f.id] = s[i].signedUrl; });
      }
      return { files, urls };
    },
  });
  const files = data?.files ?? [];
  const shown = cat === "all" ? files : files.filter((f) => f.category === cat);

  const open = async (f: LibFile) => {
    const { data } = await supabase.storage.from("library").createSignedUrl(f.storage_path, 3600);
    if (data?.signedUrl) setPreview({ f, url: data.signedUrl });
  };
  const download = async (f: LibFile) => {
    const { data, error } = await supabase.storage.from("library").createSignedUrl(f.storage_path, 300, { download: f.file_name });
    if (error || !data) return toast.error("Downloaden lukt niet");
    window.location.href = data.signedUrl;
  };
  const remove = async (f: LibFile) => {
    if (!confirm(`"${f.file_name}" verwijderen?`)) return;
    await supabase.storage.from("library").remove([f.storage_path]);
    const { error } = await supabase.from("library_files").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Bestand verwijderd");
    qc.invalidateQueries({ queryKey: ["library"] });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="wordmark">Branding</h1>
        {isAdmin && clientId && (
          <button onClick={() => setUploading(true)} className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-2 pr-5 text-sm font-medium text-background">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><Plus className="h-4 w-4" /></span>Bestand uploaden
          </button>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Categorie">
        <button aria-pressed={cat === "all"} onClick={() => setCat("all")} className="chip-filter shrink-0">Alles <span className="ml-1.5 text-muted-foreground tabular">{files.length}</span></button>
        {(Object.keys(CATS) as Cat[]).map((k) => (
          <button key={k} aria-pressed={cat === k} onClick={() => setCat(k)} className="chip-filter shrink-0">{CATS[k]} <span className="ml-1.5 text-muted-foreground tabular">{files.filter((f) => f.category === k).length}</span></button>
        ))}
      </div>

      {!clientId && ready ? <section className="rounded-lg bg-card"><EmptyState text="Je account is nog niet aan een klant gekoppeld." /></section>
        : isLoading ? <section className="rounded-lg bg-card"><EmptyState text="Laden…" /></section>
        : shown.length === 0 ? (
          <section className="rounded-lg bg-card px-6 py-12 text-center">
            <p className="text-lg font-semibold">Nog geen bestanden</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Hier vind je straks je logo's, brandbook, foto's en video's. HIBE zet ze klaar; je kunt ze hier bekijken en downloaden.</p>
          </section>
        ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((f) => (
            <li key={f.id} className="flex flex-col gap-3 rounded-lg bg-card p-3">
              <button onClick={() => (isImg(f) || isPdf(f) ? open(f) : download(f))} className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[16px] bg-muted text-sm font-semibold uppercase text-muted-foreground" aria-label={`Bekijk ${f.file_name}`}>
                {data?.urls[f.id] ? <img src={data.urls[f.id]} alt="" loading="lazy" className="h-full w-full object-cover" /> : (f.file_name.split(".").pop() ?? "bestand")}
              </button>
              <div className="px-1">
                <p className="truncate font-semibold" title={f.file_name}>{f.file_name}</p>
                {f.description && <p className="line-clamp-2 text-sm text-muted-foreground">{f.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5"><span className="chip">{CATS[f.category]}</span>{f.size_bytes != null && <span className="chip">{fmtSize(f.size_bytes)}</span>}</div>
              </div>
              <div className="mt-auto flex gap-2 px-1 pb-1">
                <Button size="sm" onClick={() => download(f)}><Download className="h-4 w-4" /> Download</Button>
                {isAdmin && <Button size="sm" variant="ghost" aria-label={`Verwijder ${f.file_name}`} onClick={() => remove(f)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <Dialog open onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle className="truncate pr-6">{preview.f.file_name}</DialogTitle></DialogHeader>
            {isPdf(preview.f)
              ? <iframe src={preview.url} title={preview.f.file_name} className="h-[70vh] w-full rounded-2xl bg-popover" />
              : <img src={preview.url} alt={preview.f.file_name} className="max-h-[70vh] w-full rounded-2xl bg-popover object-contain" />}
            <Button onClick={() => download(preview.f)} className="w-fit"><Download className="h-4 w-4" /> Download</Button>
          </DialogContent>
        </Dialog>
      )}
      {uploading && clientId && <UploadDialog clientId={clientId} existing={files} onClose={() => setUploading(false)} />}
    </div>
  );
}

function UploadDialog({ clientId, existing, onClose }: { clientId: string; existing: LibFile[]; onClose: () => void }) {
  const { user } = UserAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<Cat>("logos");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const dup = !!file && existing.some((f) => f.category === category && f.file_name === file.name);
  useEffect(() => { if (dup) toast.error(`"${file!.name}" bestaat al in ${CATS[category]}`); }, [dup]); // eslint-disable-line

  const save = async () => {
    if (!file || dup) return;
    setBusy(true);
    const path = `${clientId}/${category}/${file.name}`;
    const { error: upErr } = await supabase.storage.from("library").upload(path, file, { contentType: file.type || undefined });
    if (upErr) { setBusy(false); return toast.error(/exist|duplicate/i.test(upErr.message) ? "Er bestaat al een bestand met deze naam" : upErr.message); }
    const { error } = await supabase.from("library_files").insert({
      client_id: clientId, category, file_name: file.name, storage_path: path, description: description.trim() || null,
      mime_type: file.type || null, size_bytes: file.size, uploaded_by: user?.id,
    });
    setBusy(false);
    if (error) { await supabase.storage.from("library").remove([path]); return toast.error(error.code === "23505" ? "Er bestaat al een bestand met deze naam" : error.message); }
    toast.success("Bestand geüpload");
    qc.invalidateQueries({ queryKey: ["library"] });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Bestand uploaden</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label htmlFor="file">Bestand</Label><Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          {dup && <p className="text-sm text-destructive">Er staat al een bestand met deze naam in {CATS[category]}. Geef het bestand een andere naam.</p>}
          <div><Label>Categorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Cat)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(CATS) as Cat[]).map((k) => <SelectItem key={k} value={k}>{CATS[k]}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="desc">Omschrijving</Label><Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <Button disabled={!file || dup || busy} onClick={save}>{busy ? "Uploaden…" : "Uploaden"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
