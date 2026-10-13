import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, PlatformDot } from "@/components/StatsOverview";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ReviewItem, ReviewStatus, REVIEW_ACTION_LABEL, REVIEW_STATUS_LABEL,
  uploadReviewMedia, useReviewEvents, useReviewItems,
} from "@/hooks/useReviews";

const MAX_BYTES = 500 * 1024 * 1024;
const ACCEPT = "video/mp4,video/quicktime,.mp4,.mov,image/jpeg,image/png,image/webp";
const NETWORKS = [
  { key: "instagram", label: "Instagram", dot: "ig" },
  { key: "tiktok", label: "TikTok", dot: "tt" },
  { key: "youtube", label: "YouTube", dot: "yt" },
  { key: "facebook", label: "Facebook", dot: "fb" },
  { key: "linkedin", label: "LinkedIn", dot: "li" },
  { key: "threads", label: "Threads", dot: "th" },
];
const netInfo = (n: string) => NETWORKS.find((x) => x.key === n) ?? { key: n, label: n, dot: n };
const fmtDate = (d: string | null, time = true) =>
  d ? new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "Geen datum";

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-lime text-lime-foreground",
  approved: "bg-foreground text-background",
  rejected: "bg-popover text-destructive",
  changes_requested: "bg-muted text-foreground",
};
export function StatusLabel({ status }: { status: ReviewStatus }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>{REVIEW_STATUS_LABEL[status]}</span>;
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: ["review-items"] }); qc.invalidateQueries({ queryKey: ["review-events"] }); };
}

export default function VideoApproval() {
  const { client, clientId, isAdmin } = useClient();
  const { data: items = [], isLoading } = useReviewItems();
  const [tab, setTab] = useState<"open" | "done">("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const open = items.filter((i) => i.status === "pending" || i.status === "changes_requested");
  const done = items.filter((i) => i.status === "approved" || i.status === "rejected");
  const list = tab === "open" ? open : done;
  const selected = items.find((i) => i.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
                    <h1 className="wordmark">Video-goedkeuring</h1>
        </div>
        {isAdmin && clientId && (
          <button onClick={() => setCreating(true)} className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-2 pr-5 text-sm font-medium text-background">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><Plus className="h-4 w-4" /></span>
            Video klaarzetten
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {([["open", `Te beoordelen`, open.length], ["done", "Afgehandeld", done.length]] as const).map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className="chip-filter gap-2">
            {label} <span className="tabular text-muted-foreground">{n}</span>
          </button>
        ))}
      </div>

      {isLoading ? <section className="rounded-lg bg-card"><EmptyState text="Laden…" /></section> : list.length === 0 ? (
        <section className="rounded-lg bg-card"><EmptyState text={tab === "open" ? "Er staat niets klaar om te beoordelen." : "Nog niets afgehandeld."} /></section>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <li key={i.id} className="relative">
              <button onClick={() => setOpenId(i.id)} className="flex w-full flex-col gap-4 rounded-lg bg-card p-3 text-left transition-colors hover:bg-popover">
                <ItemThumb item={i} />
                <div className="px-2 pb-2">
                  <div className="mb-2"><StatusLabel status={i.status} /></div>
                  <p className="line-clamp-2 text-xl font-semibold leading-snug">{i.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fmtDate(i.planned_date)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {i.networks.map((n) => <span key={n} className="chip">{netInfo(n).label}</span>)}
                    {i.source === "metricool" && <span className="chip">Uit Metricool</span>}
                  </div>
                </div>
              </button>
              <span aria-hidden className="round-btn pointer-events-none absolute right-6 top-6">↗</span>
            </li>
          ))}
        </ul>
      )}

      {selected && <ReviewDialog item={selected} onClose={() => setOpenId(null)} />}
      {creating && clientId && <CreateDialog clientId={clientId} onClose={() => setCreating(false)} />}
    </div>
  );
}

function ItemThumb({ item }: { item: ReviewItem }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!item.storage_path) return;
    supabase.storage.from("review-media").createSignedUrl(item.storage_path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [item.storage_path]);
  const path = (item.storage_path ?? "").toLowerCase();
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-muted">
      {url && /\.(mp4|mov)$/.test(path) && <video src={url + "#t=0.5"} preload="metadata" muted playsInline className="h-full w-full object-cover" />}
      {url && /\.(jpe?g|png|webp)$/.test(path) && <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />}
      {!url && <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{item.external_link ? "Link" : "Geen media"}</div>}
    </div>
  );
}

function MediaPreview({ item }: { item: ReviewItem }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    if (!item.storage_path) return;
    supabase.storage.from("review-media").createSignedUrl(item.storage_path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [item.storage_path]);
  const src = url ?? item.external_link;
  if (!src) return <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">Geen media</div>;
  const path = (item.storage_path ?? item.external_link ?? "").toLowerCase().split("?")[0];
  if (/\.(mp4|mov)$/.test(path)) return <video src={src} controls playsInline className="max-h-[60vh] w-full rounded-md bg-foreground" />;
  if (/\.(jpe?g|png|webp)$/.test(path)) return <img src={src} alt="" className="max-h-[60vh] w-full rounded-md object-contain bg-muted" />;
  return <a href={src} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/40"><ExternalLink className="h-4 w-4" /> Open de link</a>;
}

function ReviewDialog({ item, onClose }: { item: ReviewItem; onClose: () => void }) {
  const { isAdmin, client } = useClient();
  const { data: events = [] } = useReviewEvents(item.id);
  const invalidate = useInvalidate();
  const [mode, setMode] = useState<null | "changes_requested" | "rejected">(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = [...new Set(events.map((e) => e.user_id).filter(Boolean))] as string[];
    if (!ids.length) return;
    supabase.from("users").select("id,email,full_name").in("id", ids).then(({ data }) =>
      setNames(Object.fromEntries((data ?? []).map((u) => [u.id, u.full_name || u.email]))));
  }, [events]);

  const act = async (action: string, extra: { _note?: string; _storage_path?: string } = {}) => {
    setBusy(true);
    const { error } = await supabase.rpc("review_action", { _item_id: item.id, _action: action, ...extra });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(action === "new_version" ? "Nieuwe versie staat klaar" : `Opgeslagen: ${REVIEW_ACTION_LABEL[action].toLowerCase()}`);
    setMode(null); setNote("");
    invalidate();
  };

  const newVersion = async (file: File) => {
    if (file.size > MAX_BYTES) return toast.error("Bestand is groter dan 500 MB");
    try {
      setProgress(0);
      const path = await uploadReviewMedia(item.client_id, file, setProgress);
      await act("new_version", { _storage_path: path });
    } catch (e) { toast.error(String((e as Error).message)); }
    setProgress(null);
  };

  const metricoolLink = client?.metricool_blog_id ? `https://app.metricool.com/planner?blogId=${client.metricool_blog_id}` : "https://app.metricool.com/planner";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <DialogTitle className="text-lg leading-snug">{item.title}</DialogTitle>
            <StatusLabel status={item.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {fmtDate(item.planned_date)}{item.networks.length > 0 && " · " + item.networks.map((n) => netInfo(n).label).join(", ")}
          </p>
        </DialogHeader>

        {isAdmin && item.source === "metricool" && item.status === "rejected" && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <p className="font-medium">Zet deze post in Metricool op concept.</p>
            <a href={metricoolLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 underline">Open in Metricool <ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        )}

        <MediaPreview item={item} />
        {item.caption && <p className="whitespace-pre-line text-sm text-foreground/80">{item.caption}</p>}

        {item.status === "pending" && (
          <div className="space-y-3 border-t pt-4">
            {mode ? (
              <>
                <Label htmlFor="note">{mode === "rejected" ? "Reden van afkeuren" : "Wat moet er anders?"}</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} autoFocus />
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy || !note.trim()} variant={mode === "rejected" ? "destructive" : "default"} onClick={() => act(mode, { _note: note })}>
                    {mode === "rejected" ? "Afkeuren" : "Wijziging vragen"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setMode(null); setNote(""); }}>Annuleren</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => act("approved")}>Goedkeuren</Button>
                <Button variant="outline" onClick={() => setMode("changes_requested")}>Wijziging vragen</Button>
                <Button variant="outline" onClick={() => setMode("rejected")}>Afkeuren</Button>
              </div>
            )}
          </div>
        )}

        {isAdmin && item.status === "changes_requested" && (
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="newv">Nieuwe versie uploaden</Label>
            <Input id="newv" type="file" accept={ACCEPT} disabled={progress != null} onChange={(e) => e.target.files?.[0] && newVersion(e.target.files[0])} />
            {progress != null && <Progress value={progress} />}
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="mb-2 text-sm font-semibold">Historie</h3>
          <ol className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex flex-col gap-0.5">
                <span><span className="font-medium">{REVIEW_ACTION_LABEL[e.action] ?? e.action}</span>
                  <span className="text-muted-foreground"> · {fmtDate(e.created_at)} · {e.user_id ? names[e.user_id] ?? "HIBE" : "Metricool"}</span></span>
                {e.note && <span className="text-foreground/80">“{e.note}”</span>}
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateDialog({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");
  const [nets, setNets] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = useMemo(() => title.trim() && (file || /^https?:\/\//.test(link.trim())), [title, file, link]);

  const save = async () => {
    if (file && file.size > MAX_BYTES) return toast.error("Bestand is groter dan 500 MB");
    setBusy(true);
    try {
      let storage_path: string | null = null;
      if (file) { setProgress(0); storage_path = await uploadReviewMedia(clientId, file, setProgress); }
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("review_items").insert({
        client_id: clientId, title: title.trim(), caption: caption.trim() || null,
        planned_date: date ? new Date(date).toISOString() : null, networks: nets, source: "hibe",
        storage_path, external_link: file ? null : link.trim(), created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Item staat klaar voor de klant");
      invalidate();
      onClose();
    } catch (e) { toast.error(String((e as Error).message)); }
    setBusy(false); setProgress(null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Nieuw item ter goedkeuring</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="t">Titel</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="c">Caption</Label><Textarea id="c" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="d">Geplande datum</Label><Input id="d" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Kanalen</legend>
            <div className="flex flex-wrap gap-4">
              {NETWORKS.map((n) => (
                <label key={n.key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={nets.includes(n.key)} onCheckedChange={(c) => setNets((s) => c ? [...s, n.key] : s.filter((x) => x !== n.key))} />
                  {n.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="f">Bestand (mp4, mov of afbeelding, max 500 MB)</Label>
            <Input id="f" type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {!file && (
            <div className="space-y-1.5"><Label htmlFor="l">Of plak een link</Label><Input id="l" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} /></div>
          )}
          {progress != null && <div className="space-y-1"><Progress value={progress} /><p className="text-xs tabular text-muted-foreground">{progress}% geüpload</p></div>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>Annuleren</Button>
            <Button onClick={save} disabled={!valid || busy}><Upload /> Klaarzetten</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
