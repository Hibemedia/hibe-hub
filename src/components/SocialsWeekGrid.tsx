import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Link2, Plus, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/StatsOverview";
import { useClient } from "@/context/ClientContext";
import { useVideoItems } from "@/hooks/useVideos";
import { VIDEO_STATUS_LABEL } from "@/lib/videos";
import { cn } from "@/lib/utils";
import {
  Item, Post, PostStatus, SClient, STATUSES, WEEKLY, Week,
  callSocials, cellCls, linkSocialVideo, nextStatus, statusOf, unlinkSocialVideo,
  useSocialVideoLinks, videoToPostStatus, weekDates, weekItems, ymd,
} from "@/lib/socials";

const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** Full week table of the Review Hub checklist: all clients, day cells, "Deze week" progress. */
export function SocialsWeekGrid() {
  const qc = useQueryClient();
  const { clients: hibeClients } = useClient();
  const [offset, setOffset] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const press = useRef<{ t?: ReturnType<typeof setTimeout>; long?: boolean }>({});

  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  const dates = weekDates(base);
  const from = dates[0], to = dates[6], today = ymd(new Date());
  const isCurrentWeek = from <= today && today <= to;
  const todayIdx = isCurrentWeek ? dates.indexOf(today) : -1;
  const key = ["socials-week", from];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => callSocials<{ clients: SClient[]; posts: Post[]; weeks: Week[] }>({ action: "load", from, to, weekFrom: from }),
    refetchInterval: 30000,
  });
  const { data: links = [] } = useSocialVideoLinks();
  const { data: videos = [] } = useVideoItems();

  const posts = useMemo(() => new Map((data?.posts ?? []).map((p) => [`${p.client_id}_${p.post_date}`, p])), [data]);
  const weeks = useMemo(() => new Map((data?.weeks ?? []).map((w) => [`${w.client_id}_${w.week_start}`, w])), [data]);
  const active = (data?.clients ?? []).filter((c) => c.is_active);
  const hibeName = (id: string) => hibeClients.find((c) => c.id === id)?.name ?? "Klant";
  const linkFor = (cid: string, d: string) => links.find((l) => l.social_client_id === cid && l.post_date === d);
  const effStatus = (cid: string, d: string): PostStatus => {
    const l = linkFor(cid, d);
    if (l) { const v = videos.find((x) => x.id === l.video_item_id); return v ? videoToPostStatus(v.status) : "none"; }
    return posts.get(`${cid}_${d}`)?.status ?? "none";
  };

  const savePost = async (c: string, date: string, patch: Partial<Post>) => {
    const cur = posts.get(`${c}_${date}`) ?? { client_id: c, post_date: date, status: "none" as PostStatus, note: null, title: null };
    const next = { ...cur, ...patch };
    qc.setQueryData(key, (old: any) => old && { ...old, posts: [...old.posts.filter((p: Post) => !(p.client_id === c && p.post_date === date)), next] });
    try { await callSocials({ action: "set_post", client_id: c, post_date: date, status: next.status, note: next.note || null, title: next.title || null }); }
    catch { toast.error("Kon niet opslaan"); qc.invalidateQueries({ queryKey: key }); }
  };
  const saveWeek = async (c: string, ws: string, items: Item[]) => {
    qc.setQueryData(key, (old: any) => old && { ...old, weeks: [...old.weeks.filter((w: Week) => !(w.client_id === c && w.week_start === ws)), { client_id: c, week_start: ws, count: 0, items }] });
    try { await callSocials({ action: "set_week", client_id: c, week_start: ws, items }); }
    catch { toast.error("Kon niet opslaan"); qc.invalidateQueries({ queryKey: key }); }
  };
  const link = async (cid: string, d: string, videoId: string) => {
    try { await linkSocialVideo(cid, d, videoId); qc.invalidateQueries({ queryKey: ["social-video-links"] }); }
    catch { toast.error("Koppelen mislukt"); }
  };
  const unlink = async (id: string) => {
    try { await unlinkSocialVideo(id); qc.invalidateQueries({ queryKey: ["social-video-links"] }); }
    catch { toast.error("Loskoppelen mislukt"); }
  };

  /** Progress per client: [done, planned]. */
  const progress = (c: SClient): [number, number] => {
    if (c.tracking_mode === "weekly") {
      const items = weekItems(weeks.get(`${c.id}_${from}`));
      return [items.filter((i) => i.status === "scheduled").length, c.weekly_target];
    }
    const sts = dates.map((d) => effStatus(c.id, d));
    return [sts.filter((s) => s === "scheduled").length, sts.filter((s) => s !== "none").length];
  };

  const rows = active.filter((c) => {
    if (!openOnly) return true;
    const [done, planned] = progress(c);
    return !(planned > 0 && done >= planned);
  });
  const [totDone, totPlanned] = active.reduce<[number, number]>((a, c) => { const [d, p] = progress(c); return [a[0] + d, a[1] + p]; }, [0, 0]);

  const monday = new Date(from + "T00:00:00");
  const weekLabel = `${monday.getDate()} ${monday.toLocaleString("nl-NL", { month: "short" })}`;
  const barCls = (done: number, planned: number) =>
    planned > 0 && done >= planned ? "bg-[hsl(var(--success))]"
    : done === 0 && (to < today || (isCurrentWeek && todayIdx >= 4)) ? "bg-destructive"
    : "bg-lime";

  const startPress = (k: string) => {
    press.current.long = false;
    press.current.t = setTimeout(() => { press.current.long = true; setMenu(k); }, 550);
  };
  const endPress = () => { if (press.current.t) clearTimeout(press.current.t); };

  if (isLoading) return <EmptyState text="Laden…" />;
  if (error) return <EmptyState text={"De checklist kon niet worden geladen: " + (error as Error).message} />;
  if (active.length === 0) return <EmptyState text="Nog geen klanten in de checklist." />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button aria-label="Vorige week" className="round-btn h-8 w-8" onClick={() => setOffset(offset - 1)}><ChevronLeft className="h-4 w-4" /></button>
        <span className="chip">week van {weekLabel}</span>
        <button aria-label="Volgende week" className="round-btn h-8 w-8" onClick={() => setOffset(offset + 1)}><ChevronRight className="h-4 w-4" /></button>
        <button className="chip-filter h-8 px-3 text-xs" aria-pressed={offset === 0} onClick={() => setOffset(0)}>Deze week</button>
        <button className="chip-filter h-8 px-3 text-xs" aria-pressed={openOnly} onClick={() => setOpenOnly(!openOnly)}>Alleen open</button>
        <span className="ml-auto text-sm text-muted-foreground tabular"><b className="text-foreground">{totDone}</b> van {totPlanned} posts ingepland deze week</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {STATUSES.slice(1).map((s) => <span key={s.key} className="inline-flex items-center gap-1.5"><span className={cn("flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold", cellCls(s.key))}>{s.symbol}</span>{s.label}</span>)}
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0.5 text-xs">
          <colgroup><col className="w-32 md:w-44" />{dates.map((d) => <col key={d} />)}<col className="w-32 md:w-36" /></colgroup>
          <thead><tr>
            <th className="sticky left-0 z-10 bg-card px-2 text-left font-medium text-muted-foreground">Klant</th>
            {dates.map((d, i) => (
              <th key={d} className="p-0.5 font-medium">
                <div className={cn("rounded-md px-1 py-0.5", d === today ? "bg-foreground text-background" : "text-muted-foreground")}>
                  <div>{DAYS[i]}</div><div>{new Date(d + "T00:00:00").getDate()}</div>
                </div>
              </th>
            ))}
            <th className="px-1 text-left font-medium text-muted-foreground">Deze week</th>
          </tr></thead>
          <tbody>
            {rows.map((c) => {
              const weeklyMode = c.tracking_mode === "weekly";
              const [done, planned] = progress(c);
              return (
                <tr key={c.id}>
                  <td className="sticky left-0 z-10 bg-card px-2 font-medium" title={c.name}><span className="block truncate">{c.name}</span></td>
                  {dates.map((d) => {
                    if (weeklyMode) return <td key={d}><div className="h-9 rounded-md bg-background/50" /></td>;
                    const k = `${c.id}_${d}`;
                    const l = linkFor(c.id, d);
                    const video = l ? videos.find((v) => v.id === l.video_item_id) : null;
                    const p = posts.get(k);
                    const eff = effStatus(c.id, d);
                    const st = statusOf(eff);
                    const hover = l ? (video ? `${video.title} · ${VIDEO_STATUS_LABEL[video.status]}` : "Gekoppelde video") : [p?.title, p?.note].filter(Boolean).join(" · ");
                    return (
                      <td key={d} className={cn(d === today && "rounded-md ring-1 ring-inset ring-foreground/25")}>
                        <Popover open={menu === k} onOpenChange={(o) => { if (!o && menu === k) setMenu(null); }}>
                          <PopoverTrigger asChild>
                            <button
                              aria-label={`${c.name} ${d}: ${st.label}`}
                              title={hover || st.label}
                              onClick={() => { if (press.current.long) { press.current.long = false; return; } if (l) setMenu(k); else savePost(c.id, d, { status: nextStatus(eff) }); }}
                              onContextMenu={(e) => { e.preventDefault(); setMenu(k); }}
                              onPointerDown={() => startPress(k)}
                              onPointerUp={endPress}
                              onPointerLeave={endPress}
                              onPointerMove={endPress}
                              className={cn("relative flex h-9 w-full items-center justify-center rounded-md font-bold", cellCls(eff))}>
                              {st.symbol}
                              {(p?.note || p?.title) && !l && <span className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-current" />}
                              {l && <Link2 className="absolute right-0.5 top-0.5 h-2.5 w-2.5" aria-hidden />}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 space-y-3">
                            <p className="text-sm font-semibold">{c.name} · {new Date(d + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}</p>
                            {l ? (
                              <div className="space-y-2 rounded-md bg-background p-2.5">
                                <p className="flex items-center gap-1.5 text-xs font-medium"><Link2 className="h-3.5 w-3.5" />Volgt de status van de video</p>
                                <p className="truncate text-sm font-semibold">{video?.title ?? "Video niet gevonden"}</p>
                                {video && <p className="text-xs text-muted-foreground">{hibeName(video.client_id)} · {VIDEO_STATUS_LABEL[video.status]}</p>}
                                <button onClick={() => { unlink(l.id); setMenu(null); }} className="inline-flex items-center gap-1 text-xs text-destructive"><Unlink className="h-3 w-3" />Koppeling verwijderen</button>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-1">
                                  {STATUSES.map((s) => <button key={s.key} onClick={() => savePost(c.id, d, { status: s.key })} className={cn("rounded-md px-2 py-1 text-left text-xs", cellCls(s.key), eff === s.key && "ring-2 ring-foreground")}><b className="mr-1">{s.symbol}</b>{s.label}</button>)}
                                </div>
                                <div className="space-y-1"><Label className="text-xs">Titel</Label><Input defaultValue={p?.title ?? ""} onBlur={(e) => e.target.value !== (p?.title ?? "") && savePost(c.id, d, { title: e.target.value })} /></div>
                                <div className="space-y-1"><Label className="text-xs">Notitie / link</Label><Input defaultValue={p?.note ?? ""} onBlur={(e) => e.target.value !== (p?.note ?? "") && savePost(c.id, d, { note: e.target.value })} /></div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Koppel een video uit Video's</Label>
                                  <Select onValueChange={(v) => { link(c.id, d, v); setMenu(null); }}>
                                    <SelectTrigger aria-label="Koppel een video" className="h-9"><SelectValue placeholder="Kies een video…" /></SelectTrigger>
                                    <SelectContent>
                                      {videos.filter((v) => v.status !== "archived").map((v) => <SelectItem key={v.id} value={v.id}>{v.title} · {hibeName(v.client_id)}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </PopoverContent>
                        </Popover>
                      </td>
                    );
                  })}
                  <td className="px-1">
                    {weeklyMode ? (
                      <Popover open={menu === `week_${c.id}`} onOpenChange={(o) => { if (!o && menu === `week_${c.id}`) setMenu(null); }}>
                        <PopoverTrigger asChild>
                          <button className="w-full text-left" aria-label={`${c.name}: ${done} van ${planned} deze week`}>
                            <WeekBar done={done} planned={planned} barCls={barCls(done, planned)} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 space-y-3">
                          <p className="text-sm font-semibold">{c.name} · week van {weekLabel}</p>
                          <WeekItems c={c} ws={from} items={weekItems(weeks.get(`${c.id}_${from}`))} saveWeek={saveWeek} />
                        </PopoverContent>
                      </Popover>
                    ) : <WeekBar done={done} planned={planned} barCls={barCls(done, planned)} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Klik op een vakje voor de volgende status · rechtsklik of houd ingedrukt voor titel, notitie en koppeling.</p>
    </div>
  );
}

function WeekBar({ done, planned, barCls }: { done: number; planned: number; barCls: string }) {
  const pct = planned > 0 ? Math.min(100, (done / planned) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
        <div className={cn("h-full rounded-full transition-all", barCls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs tabular text-muted-foreground">{done}/{planned}</span>
    </div>
  );
}

function WeekItems({ c, ws, items, saveWeek }: { c: SClient; ws: string; items: Item[]; saveWeek: (c: string, ws: string, items: Item[]) => void }) {
  return (
    <div className="space-y-3">
      {items.map((it, idx) => { const st = statusOf(it.status); return (
        <div key={it.id} className="space-y-2 rounded-md bg-background p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">Video {idx + 1} · {st.label}</p>
            <button onClick={() => saveWeek(c.id, ws, items.filter((_, j) => j !== idx))} className="inline-flex items-center gap-1 text-xs text-destructive"><Trash2 className="h-3 w-3" />Verwijderen</button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {WEEKLY.map((s) => { const x = statusOf(s); return <button key={s} onClick={() => saveWeek(c.id, ws, items.map((v, j) => j === idx ? { ...v, status: s } : v))} className={cn("rounded-md px-2 py-1 text-left text-xs", cellCls(s), it.status === s && "ring-2 ring-foreground")}><b className="mr-1">{x.symbol}</b>{s === "scheduled" ? "Afgeleverd" : x.label}</button>; })}
          </div>
          <div className="space-y-1"><Label className="text-xs">Titel</Label><Input defaultValue={it.title} onBlur={(e) => e.target.value !== it.title && saveWeek(c.id, ws, items.map((v, j) => j === idx ? { ...v, title: e.target.value } : v))} /></div>
          <div className="space-y-1"><Label className="text-xs">Notitie / link</Label><Input defaultValue={it.note} onBlur={(e) => e.target.value !== it.note && saveWeek(c.id, ws, items.map((v, j) => j === idx ? { ...v, note: e.target.value } : v))} /></div>
        </div>
      ); })}
      <button onClick={() => saveWeek(c.id, ws, [...items, { id: crypto.randomUUID(), title: "", status: "in_progress", note: "" }])} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background"><Plus className="h-3.5 w-3.5" />Video toevoegen</button>
    </div>
  );
}
