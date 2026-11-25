import { useEffect, useMemo, useState } from "react";
import { Link2, Search, Unlink } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/lib/utils";
import {
  STATUSES, cellCls, filterPickableVideos, statusOf, videoToPostStatus,
  type Post, type PostStatus, type SocialVideoLink,
} from "@/lib/socials";
import { VIDEO_STATUS_LABEL } from "@/lib/videos";
import type { VideoItem } from "@/hooks/useVideos";

/** The checklist cell currently being edited. */
export type SocialsCell = { clientId: string; date: string };

/** Colored left strip per status, matching the legend under the checklist. */
export const statusBarCls = (s: PostStatus) =>
  s === "scheduled" ? "border-l-[hsl(var(--social-green-fg))]"
  : s === "none" ? "border-l-border"
  : s === "to_post" ? "border-l-[hsl(var(--social-amber-fg))]"
  : s === "internal_check" ? "border-l-[hsl(var(--social-orange-fg))]"
  : s === "client_check" ? "border-l-[hsl(var(--social-cyan-fg))]"
  : s === "in_progress" ? "border-l-[hsl(var(--social-blue-fg))]"
  : "border-l-[hsl(var(--social-purple-fg))]"; // to_schedule

/** Name + link fields of a checklist cell, saved together with one explicit button. */
export function PostFields({ title, note, onSave }: { title: string; note: string; onSave: (title: string, note: string) => void }) {
  const [t, setT] = useState(title);
  const [n, setN] = useState(note);
  const dirty = t !== title || n !== note;
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">Naam van de video</Label>
        <Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Bijv. Behind the scenes" className="h-8" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Link van de video</Label>
        <Input value={n} onChange={(e) => setN(e.target.value)} placeholder="https://…" className="h-8" />
      </div>
      <Button size="sm" variant="outline" className="w-full" disabled={!dirty} onClick={() => onSave(t, n)}>Opslaan</Button>
    </div>
  );
}

/**
 * Right-hand sidebar for one checklist cell: status (or the linked video) on top,
 * the full list of pickable videos underneath, always visible with its own search.
 */
export function SocialsCellPanel({ cell, cellLabel, eff, post, link, video, videos, clientName, onSave, onLink, onUnlink, onClose }: {
  cell: SocialsCell | null;
  /** Name of the checklist client, as the checklist itself shows it. */
  cellLabel: string;
  eff: PostStatus;
  post: Post | null;
  link: SocialVideoLink | null;
  video: VideoItem | null;
  videos: VideoItem[];
  clientName: (id: string) => string;
  onSave: (patch: Partial<Post>) => void;
  onLink: (videoId: string) => void;
  onUnlink: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [onlyClient, setOnlyClient] = useState(false);

  /** Opening another cell starts with a clean search and the full list. */
  useEffect(() => { setQ(""); setOnlyClient(false); }, [cell?.clientId, cell?.date]);

  const list = useMemo(
    () => filterPickableVideos(videos, q, clientName, onlyClient ? cellLabel : null),
    [videos, q, clientName, onlyClient, cellLabel],
  );
  /** One block per client, in the order the videos arrive (newest activity first). */
  const groups = useMemo(() => {
    const m = new Map<string, VideoItem[]>();
    for (const v of list) { const g = m.get(v.client_id); if (g) g.push(v); else m.set(v.client_id, [v]); }
    return [...m.entries()];
  }, [list]);

  const st = statusOf(eff);
  const dateLabel = cell
    ? new Date(cell.date + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <Sheet open={!!cell} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden border-l border-border bg-card p-0 sm:max-w-[440px]">
        <SheetHeader className="shrink-0 space-y-1 border-b border-border px-4 py-3 text-left">
          <SheetDescription className="text-xs">{dateLabel}</SheetDescription>
          <SheetTitle className="truncate text-base">{cellLabel}</SheetTitle>
          <span className={cn("inline-flex items-center gap-1.5 rounded-control px-1.5 py-0.5 text-[11px] font-semibold", cellCls(eff))}>
            <b className="w-3 text-center">{st.symbol || "–"}</b>{st.label}
          </span>
        </SheetHeader>

        <div className="max-h-[46%] min-h-0 shrink-0 overflow-y-auto border-b border-border px-4 py-3">
          {link ? (
            <div className="space-y-2 rounded-md bg-background p-2.5">
              <p className="flex items-center gap-1.5 text-xs font-medium"><Link2 className="h-3.5 w-3.5" />Volgt de status van de video</p>
              <p className="truncate text-sm font-semibold">{video?.title ?? "Video niet gevonden"}</p>
              {video && <p className="text-xs text-muted-foreground">{clientName(video.client_id)} · {VIDEO_STATUS_LABEL[video.status]}</p>}
              <button onClick={onUnlink} className="inline-flex items-center gap-1 text-xs text-destructive transition hover:opacity-80"><Unlink className="h-3 w-3" />Koppeling verwijderen</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <div className="grid grid-cols-2 gap-1">
                  {STATUSES.map((s) => (
                    <button key={s.key} onClick={() => onSave({ status: s.key })}
                      className={cn("flex items-center gap-1.5 rounded-md border-l-4 px-2 py-1.5 text-left text-xs transition hover:bg-muted/60", statusBarCls(s.key), eff === s.key ? "bg-muted font-semibold" : "bg-card")}>
                      <b className="w-3 text-center">{s.symbol || "–"}</b><span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <PostFields title={post?.title ?? ""} note={post?.note ?? ""} onSave={(t, n) => onSave({ title: t || null, note: n || null })} />
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
          <div className="flex shrink-0 items-baseline gap-2">
            <Label className="text-xs">Koppel een video uit Video's</Label>
            <span className="ml-auto text-[11px] tabular text-muted-foreground">{list.length}</span>
          </div>
          <div className="mt-1.5 flex shrink-0 gap-1">
            <FilterChip className="h-7 px-2 text-xs" active={!onlyClient} onClick={() => setOnlyClient(false)}>Alles</FilterChip>
            <FilterChip className="h-7 max-w-[200px] px-2 text-xs" active={onlyClient} disabled={!cell} onClick={() => setOnlyClient(true)}>
              <span className="truncate">Alleen {cellLabel}</span>
            </FilterChip>
          </div>
          <div className="relative mt-1.5 shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek op titel of klant…" className="h-8 pl-8" aria-label="Zoek een video" />
          </div>
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto" aria-label="Beschikbare video's">
            {groups.length === 0 ? (
              <p className="px-1 py-3 text-sm text-muted-foreground">Geen video gevonden.</p>
            ) : groups.map(([cid, vs]) => (
              <div key={cid} className="mb-2">
                <p className="sticky top-0 z-10 bg-card px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{clientName(cid)}</p>
                {vs.map((v) => (
                  <button key={v.id} onClick={() => onLink(v.id)}
                    className="flex w-full items-start gap-2 rounded-md px-1 py-1.5 text-left transition hover:bg-muted">
                    <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-control", cellCls(videoToPostStatus(v.status)))} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{v.title || "Naamloze video"}</span>
                      <span className="block truncate text-xs text-muted-foreground">{VIDEO_STATUS_LABEL[v.status]}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
