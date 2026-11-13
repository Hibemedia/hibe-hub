import { SegmentedControl } from "@/components/ui/segmented-control";
import { FilterChip } from "@/components/ui/filter-chip";
import { Tag } from "@/components/ui/tag";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Link2, Plus, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  callSocials, cellCls, linkSocialVideo, mondayOf, statusOf, unlinkSocialVideo,
  useSocialVideoLinks, videoToPostStatus, weekDates, weekItems, ymd,
} from "@/lib/socials";

const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DOW_LETTERS = ["m", "d", "w", "d", "v", "z", "z"];
const dow = (d: string) => (new Date(d + "T00:00:00").getDay() + 6) % 7; // 0 = maandag

/** Colored left strip per status in the status picker popup, matching the legend. */
const statusBarCls = (s: PostStatus) =>
  s === "scheduled" ? "border-l-[hsl(var(--social-green-fg))]"
  : s === "none" ? "border-l-border"
  : s === "to_post" ? "border-l-[hsl(var(--social-amber-fg))]"
  : s === "internal_check" ? "border-l-[hsl(var(--social-orange-fg))]"
  : s === "client_check" ? "border-l-[hsl(var(--social-cyan-fg))]"
  : s === "in_progress" ? "border-l-[hsl(var(--social-blue-fg))]"
  : "border-l-[hsl(var(--social-purple-fg))]"; // to_schedule

/** Name + link fields of a checklist cell, saved together with one explicit button. */
function PostFields({ title, note, onSave }: { title: string; note: string; onSave: (title: string, note: string) => void }) {
  const [t, setT] = useState(title);
  const [n, setN] = useState(note);
  const dirty = t !== title || n !== note;
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">Naam van de video</Label>
        <Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Bijv. Behind the scenes" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Link van de video</Label>
        <Input value={n} onChange={(e) => setN(e.target.value)} placeholder="https://…" />
      </div>
      <Button size="sm" className="w-full" disabled={!dirty} onClick={() => onSave(t, n)}>Opslaan</Button>
    </div>
  );
}

/** Week- of maandtabel van de Review Hub-checklist: zelfde layout als het origineel, plus voortgang en videokoppelingen. */
export function SocialsWeekGrid({ weekOnly = false }: { weekOnly?: boolean } = {}) {
  const qc = useQueryClient();
  const { clients: hibeClients } = useClient();
  const [view, setView] = useState<"week" | "month">(weekOnly ? "week" : "month");
  const [offset, setOffset] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);

  const today = ymd(new Date());
  const { dates, from, to, weekFrom, label } = useMemo(() => {
    if (view === "week") {
      const base = new Date();
      base.setDate(base.getDate() + offset * 7);
      const ds = weekDates(base);
      const monday = new Date(ds[0] + "T00:00:00");
      return { dates: ds, from: ds[0], to: ds[6], weekFrom: ds[0], label: `week van ${monday.getDate()} ${monday.toLocaleString("nl-NL", { month: "short" })}` };
    }
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + offset);
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const ds = Array.from({ length: last.getDate() }, (_, i) => ymd(new Date(base.getFullYear(), base.getMonth(), i + 1)));
    return { dates: ds, from: ymd(first), to: ymd(last), weekFrom: ymd(mondayOf(first)), label: base.toLocaleString("nl-NL", { month: "long", year: "numeric" }) };
  }, [view, offset]);

  const isCurrent = from <= today && today <= to;
  const key = ["socials", view, from];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => callSocials<{ clients: SClient[]; posts: Post[]; weeks: Week[] }>({ action: "load", from, to, weekFrom }),
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

  /** Mondays of the weeks overlapping the visible range (for weekly-tracked clients in month view). */
  const rangeWeeks = useMemo(() => {
    const out: string[] = [];
    const m = mondayOf(new Date(from + "T00:00:00"));
    while (ymd(m) <= to) { out.push(ymd(m)); m.setDate(m.getDate() + 7); }
    return out;
  }, [from, to]);

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

  /** Progress per client over the visible range: [done, planned]. */
  const progress = (c: SClient): [number, number] => {
    if (c.tracking_mode === "weekly") {
      const ws = view === "week" ? [from] : rangeWeeks;
      const done = ws.reduce((n, w) => n + weekItems(weeks.get(`${c.id}_${w}`)).filter((i) => i.status === "scheduled").length, 0);
      return [done, c.weekly_target * ws.length];
    }
    const sts = dates.map((d) => effStatus(c.id, d));
    return [sts.filter((s) => s === "scheduled").length, sts.filter((s) => s !== "none").length];
  };

  const visible = (c: SClient) => {
    if (!openOnly) return true;
    const [done, planned] = progress(c);
    return !(planned > 0 && done >= planned);
  };
  const daily = active.filter((c) => c.tracking_mode !== "weekly" && visible(c));
  const weeklyClients = active.filter((c) => c.tracking_mode === "weekly" && visible(c));
  const [totDone, totPlanned] = active.reduce<[number, number]>((a, c) => { const [d, p] = progress(c); return [a[0] + d, a[1] + p]; }, [0, 0]);

  const lateInPeriod = to < today || (isCurrent && dow(today) >= 4);
  const barCls = (done: number, planned: number) =>
    planned > 0 && done >= planned ? "bg-[hsl(var(--success))]"
    : done === 0 && lateInPeriod ? "bg-destructive"
    : "bg-lime";

  if (isLoading) return <EmptyState text="Laden…" />;
  if (error) return <EmptyState text={"De checklist kon niet worden geladen: " + (error as Error).message} />;
  if (active.length === 0) return <EmptyState text="Nog geen klanten in de checklist." />;

  const colSpan = 1 + (view === "week" ? 7 : dates.length) + 1;
  const groupHeader = (label: string, sub: string) => (
    <tr key={label} className="bg-muted/60">
      <td colSpan={colSpan} className="sticky left-0 border border-border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label} <span className="font-normal normal-case">— {sub}</span>
      </td>
    </tr>
  );

  const nameCell = (c: SClient) => (
    <td className="sticky left-0 z-10 border border-border bg-card px-2 py-1 font-medium" title={c.name}>
      <span className="block truncate md:hidden">{c.abbreviation || c.name}</span>
      <span className="hidden truncate md:block">{c.name}</span>
    </td>
  );

  const dayCell = (c: SClient, d: string) => {
    const k = `${c.id}_${d}`;
    const l = linkFor(c.id, d);
    const video = l ? videos.find((v) => v.id === l.video_item_id) : null;
    const p = posts.get(k);
    const eff = effStatus(c.id, d);
    const st = statusOf(eff);
    const weekend = dow(d) >= 5;
    const hover = l ? (video ? `${video.title} · ${VIDEO_STATUS_LABEL[video.status]}` : "Gekoppelde video") : [st.label, p?.title, p?.note].filter(Boolean).join(" — ");
    return (
      <td key={d} className={cn("border border-border p-0", d === today && "ring-2 ring-inset ring-foreground")}>
        <Popover open={menu === k} onOpenChange={(o) => { if (!o && menu === k) setMenu(null); }}>
          <PopoverTrigger asChild>
            <button
              aria-label={`${c.name} ${d}: ${st.label}`}
              title={hover}
              onClick={() => setMenu(k)}
              className={cn("relative flex w-full items-center justify-center font-bold transition hover:brightness-95", view === "week" ? "h-9" : "aspect-square text-[11px]", eff === "none" && weekend ? "bg-muted" : cellCls(eff))}>
              {st.symbol}
              {(p?.note || p?.title) && !l && <span className="absolute bottom-0.5 right-0.5 h-1 w-1 rounded-control bg-current opacity-70" />}
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
                <div className="overflow-hidden rounded-md border border-border">
                  {STATUSES.map((s) => (
                    <button key={s.key} onClick={() => savePost(c.id, d, { status: s.key })}
                      className={cn("flex w-full items-center gap-2 border-l-4 px-3 py-2 text-left text-sm transition hover:bg-muted/60", statusBarCls(s.key), eff === s.key ? "bg-muted font-semibold" : "bg-card")}>
                      <b className="w-4 text-center">{s.symbol || "–"}</b>{s.label}
                    </button>
                  ))}
                </div>
                <PostFields title={p?.title ?? ""} note={p?.note ?? ""} onSave={(t, n) => savePost(c.id, d, { title: t || null, note: n || null })} />
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
  };

  /** Week view: the editable item slots of a weekly-tracked client. */
  const weekBar = (c: SClient) => {
    const items = weekItems(weeks.get(`${c.id}_${from}`));
    const slots = Math.max(c.weekly_target, items.length);
    return (
      <td colSpan={7} className="border border-border p-0">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${slots + 1}, minmax(0, 1fr))` }}>
          {Array.from({ length: slots }, (_, idx) => {
            const it = items[idx];
            const st = it ? statusOf(it.status) : null;
            const k = `week_${c.id}_${idx}`;
            return (
              <Popover key={it?.id ?? `empty-${idx}`} open={menu === k} onOpenChange={(o) => { if (!o && menu === k) setMenu(null); }}>
                <PopoverTrigger asChild>
                  <button
                    title={it ? `${it.title || "Video"} — ${st?.label}` : "Video toevoegen"}
                    onClick={() => setMenu(k)}
                    className={cn("relative flex h-9 w-full flex-col items-center justify-center leading-none transition hover:brightness-95",
                      it ? cn("font-bold", cellCls(it.status)) : "bg-background/50")}>
                    {it ? (
                      <>
                        <span>{st?.symbol}</span>
                        {it.title && <span className="mt-0.5 max-w-full truncate px-1 text-[8px] font-medium opacity-80">{it.title}</span>}
                      </>
                    ) : <span className="h-1.5 w-1.5 rounded-control bg-muted-foreground/60" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 space-y-3">
                  <p className="text-sm font-semibold">{c.name} · video {idx + 1}</p>
                  <div className="overflow-hidden rounded-md border border-border">
                    {WEEKLY.map((s) => { const x = statusOf(s); return (
                      <button key={s} onClick={() => saveWeek(c.id, from, items.map((v, j) => j === idx ? { ...v, status: s } : v))}
                        className={cn("flex w-full items-center gap-2 border-l-4 px-3 py-2 text-left text-sm transition hover:bg-muted/60", statusBarCls(s), it?.status === s ? "bg-muted font-semibold" : "bg-card")}>
                        <b className="w-4 text-center">{x.symbol || "–"}</b>{s === "scheduled" ? "Afgeleverd" : x.label}
                      </button>); })}
                  </div>
                  <PostFields title={it?.title ?? ""} note={it?.note ?? ""} onSave={(t, n) => saveWeek(c.id, from, items.map((v, j) => j === idx ? { ...v, title: t, note: n } : v))} />
                  {it && <button onClick={() => { saveWeek(c.id, from, items.filter((_, j) => j !== idx)); setMenu(null); }} className="inline-flex items-center gap-1 text-xs text-destructive"><Trash2 className="h-3 w-3" />Verwijderen</button>}
                </PopoverContent>
              </Popover>
            );
          })}
          <button aria-label="Video toevoegen" onClick={() => saveWeek(c.id, from, [...items, { id: crypto.randomUUID(), title: "", status: "in_progress", note: "" }])}
            className="flex h-9 items-center justify-center text-muted-foreground transition hover:bg-background/60"><Plus className="h-3.5 w-3.5" /></button>
        </div>
      </td>
    );
  };

  /** Month view: one read-only summary cell per week for a weekly-tracked client, spanning that week's days in the month. */
  const monthWeekCell = (c: SClient, ws: string) => {
    const items = weekItems(weeks.get(`${c.id}_${ws}`));
    const done = items.filter((i) => i.status === "scheduled").length;
    const target = c.weekly_target;
    const monday = new Date(ws + "T00:00:00");
    const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
    const start = ws < from ? new Date(from + "T00:00:00") : monday;
    const end = ymd(sunday) > to ? new Date(to + "T00:00:00") : sunday;
    const span = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const cls = items.length === 0 ? "bg-card text-muted-foreground"
      : done >= target ? "bg-[hsl(var(--social-green-bg))] text-[hsl(var(--social-green-fg))]"
      : "bg-[hsl(var(--social-blue-bg))] text-[hsl(var(--social-blue-fg))]";
    return (
      <td key={ws} colSpan={span} className="border border-border p-0" title={`Week van ${monday.getDate()} ${monday.toLocaleString("nl-NL", { month: "short" })}: ${done} van ${target} afgeleverd`}>
        <div className={cn("flex min-h-[28px] w-full items-center justify-center text-[11px] font-bold tabular", cls)}>{done}/{target}</div>
      </td>
    );
  };

  const periodWord = view === "week" ? "deze week" : "deze maand";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {weekOnly ? <Tag className="">Deze week · {label}</Tag> : <>
        <button aria-label={view === "week" ? "Vorige week" : "Vorige maand"} className="round-btn h-8 w-8" onClick={() => setOffset(offset - 1)}><ChevronLeft className="h-4 w-4" /></button>
        <Tag className="">{label}</Tag>
        <button aria-label={view === "week" ? "Volgende week" : "Volgende maand"} className="round-btn h-8 w-8" onClick={() => setOffset(offset + 1)}><ChevronRight className="h-4 w-4" /></button>
        </>}
        {!weekOnly && <SegmentedControl label="Checklistperiode" value={view} onChange={(v) => { if (v === "week" || v === "month") setView(v); setOffset(0); }} options={[{ value: "week", label: "Deze week" }, { value: "month", label: "Deze maand" }]} />}
        <FilterChip className=" h-8 px-3 text-xs" aria-pressed={openOnly} onClick={() => setOpenOnly(!openOnly)}>Alleen open</FilterChip>
        <span className="ml-auto text-sm text-muted-foreground tabular"><b className="text-foreground">{totDone}</b> van {totPlanned} posts ingepland {periodWord}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {STATUSES.slice(1).map((s) => <span key={s.key} className="inline-flex items-center gap-1.5"><span className={cn("flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold", cellCls(s.key))}>{s.symbol}</span>{s.label}</span>)}
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <table className={cn("w-full table-fixed border-collapse text-xs", view === "week" ? "min-w-[640px]" : "min-w-[1080px]")}>
          <colgroup><col className={view === "week" ? "w-32 md:w-44" : undefined} />{dates.map((d) => <col key={d} className={view === "week" ? undefined : "w-[26px]"} />)}<col className={view === "week" ? "w-32 md:w-36" : "w-28"} /></colgroup>
          <thead><tr>
            <th className="sticky left-0 z-10 border border-border bg-card px-2 py-1.5 text-left font-medium text-muted-foreground">Klant</th>
            {dates.map((d, i) => (
              <th key={d} className={cn("border border-border px-1 py-1 font-medium", d === today ? "bg-foreground text-background" : dow(d) >= 5 ? "bg-muted text-muted-foreground" : "bg-background text-muted-foreground")}>
                <div>{view === "week" ? DAYS[i] : DOW_LETTERS[dow(d)]}</div><div>{new Date(d + "T00:00:00").getDate()}</div>
              </th>
            ))}
            <th className="border border-border bg-card px-2 py-1.5 text-left font-medium text-muted-foreground">{view === "week" ? "Deze week" : "Deze maand"}</th>
          </tr></thead>
          <tbody>
            {daily.length > 0 && groupHeader("Wij plannen in", "planning per dag")}
            {daily.map((c) => {
              const [done, planned] = progress(c);
              return (
                <tr key={c.id}>
                  {nameCell(c)}
                  {dates.map((d) => dayCell(c, d))}
                  <td className="border border-border px-2 py-1"><WeekBar done={done} planned={planned} barCls={barCls(done, planned)} /></td>
                </tr>
              );
            })}
            {weeklyClients.length > 0 && groupHeader("Afleveren", view === "week" ? "aantal edits per week" : "edits per week, samengevat")}
            {weeklyClients.map((c) => {
              const [done, planned] = progress(c);
              return (
                <tr key={c.id}>
                  {nameCell(c)}
                  {view === "week" ? weekBar(c) : rangeWeeks.map((ws) => monthWeekCell(c, ws))}
                  <td className="border border-border px-2 py-1"><WeekBar done={done} planned={planned} barCls={barCls(done, planned)} /></td>
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
      <div className="h-2 flex-1 overflow-hidden rounded-control bg-background">
        <div className={cn("h-full rounded-control transition-all", barCls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs tabular text-muted-foreground">{done}/{planned}</span>
    </div>
  );
}
