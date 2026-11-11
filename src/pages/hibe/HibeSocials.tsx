import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/StatsOverview";
import { PostStatus, STATUSES, WEEKLY, statusOf, ymd, mondayOf } from "@/lib/socials";

type SClient = { id: string; name: string; abbreviation: string; category: string; is_active: boolean; tracking_mode: string; weekly_target: number };
type Post = { client_id: string; post_date: string; status: PostStatus; note: string | null; title: string | null };
type Item = { id: string; title: string; status: PostStatus; note: string };
type Week = { client_id: string; week_start: string; count: number; items: Item[] | null };

async function call<T>(body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke("socials-proxy", { body });
  if (error) throw error;
  if ((data as any)?.error) throw new Error(String((data as any).error));
  return data as T;
}

const cellCls = (s: PostStatus) => s === "scheduled" ? "bg-primary text-primary-foreground" : s === "none" ? "bg-background" : "bg-foreground/10 text-foreground";

export default function HibeSocials() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const from = ymd(new Date(y, m, 1)), to = ymd(new Date(y, m, days));
  const weekFrom = ymd(mondayOf(new Date(y, m, 1)));
  const key = ["socials", from];
  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => call<{ clients: SClient[]; posts: Post[]; weeks: Week[] }>({ action: "load", from, to, weekFrom }),
    refetchInterval: 30000,
  });
  const posts = useMemo(() => new Map((data?.posts ?? []).map((p) => [`${p.client_id}_${p.post_date}`, p])), [data]);
  const weeks = useMemo(() => new Map((data?.weeks ?? []).map((w) => [`${w.client_id}_${w.week_start}`, w])), [data]);
  const active = (data?.clients ?? []).filter((c) => c.is_active);
  const daily = active.filter((c) => c.tracking_mode !== "weekly");
  const weekly = active.filter((c) => c.tracking_mode === "weekly");
  const mondays = useMemo(() => { const out: Date[] = []; let d = mondayOf(new Date(y, m, 1)); while (d <= new Date(y, m, days)) { out.push(new Date(d)); d.setDate(d.getDate() + 7); } return out; }, [y, m, days]);
  const today = ymd(new Date());

  const savePost = async (c: string, date: string, patch: Partial<Post>) => {
    const cur = posts.get(`${c}_${date}`) ?? { client_id: c, post_date: date, status: "none" as PostStatus, note: null, title: null };
    const next = { ...cur, ...patch };
    qc.setQueryData(key, (old: any) => old && { ...old, posts: [...old.posts.filter((p: Post) => !(p.client_id === c && p.post_date === date)), next] });
    try { await call({ action: "set_post", client_id: c, post_date: date, status: next.status, note: next.note || null, title: next.title || null }); }
    catch (e) { toast.error("Kon niet opslaan"); qc.invalidateQueries({ queryKey: key }); }
  };
  const saveWeek = async (c: string, ws: string, items: Item[]) => {
    qc.setQueryData(key, (old: any) => old && { ...old, weeks: [...old.weeks.filter((w: Week) => !(w.client_id === c && w.week_start === ws)), { client_id: c, week_start: ws, count: 0, items }] });
    try { await call({ action: "set_week", client_id: c, week_start: ws, items }); }
    catch { toast.error("Kon niet opslaan"); qc.invalidateQueries({ queryKey: key }); }
  };
  const weekItems = (w?: Week): Item[] => w?.items?.length ? w.items : Array.from({ length: w?.count ?? 0 }, (_, i) => ({ id: `legacy-${i}`, title: "", status: "scheduled" as PostStatus, note: "" }));

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="wordmark">Socials</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live gekoppeld aan de checklist in HIBE Review Hub — wijzigingen staan direct op beide sites.</p>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Vorige maand" className="round-btn" onClick={() => setCursor(new Date(y, m - 1, 1))}><ChevronLeft className="h-4 w-4" /></button>
          <span className="chip-filter capitalize" aria-pressed>{cursor.toLocaleString("nl-NL", { month: "long", year: "numeric" })}</span>
          <button aria-label="Volgende maand" className="round-btn" onClick={() => setCursor(new Date(y, m + 1, 1))}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">{STATUSES.slice(1).map((s) => <span key={s.key} className="chip"><b className="mr-1">{s.symbol}</b>{s.label}</span>)}</div>

      {isLoading ? <section className="rounded-lg bg-card"><EmptyState text="Laden…" /></section>
        : error ? <section className="rounded-lg bg-card"><EmptyState text={"De checklist kon niet worden geladen: " + (error as Error).message} /></section>
        : (
        <>
          <section className="overflow-x-auto rounded-lg bg-card p-3">
            <table className="border-separate border-spacing-0.5 text-xs">
              <thead><tr>
                <th className="sticky left-0 z-10 min-w-40 bg-card px-2 text-left font-medium text-muted-foreground">Klant</th>
                {Array.from({ length: days }, (_, i) => { const d = new Date(y, m, i + 1); const we = d.getDay() % 6 === 0; return (
                  <th key={i} className={cn("w-8 min-w-8 font-medium", we ? "text-muted-foreground/50" : "text-muted-foreground", ymd(d) === today && "text-foreground underline")}>
                    <div>{["zo","ma","di","wo","do","vr","za"][d.getDay()]}</div><div>{i + 1}</div>
                  </th>); })}
              </tr></thead>
              <tbody>
                {daily.map((c) => (
                  <tr key={c.id}>
                    <td className="sticky left-0 z-10 bg-card px-2 font-medium" title={c.name}><span className="block max-w-40 truncate">{c.name}</span></td>
                    {Array.from({ length: days }, (_, i) => {
                      const date = ymd(new Date(y, m, i + 1)); const p = posts.get(`${c.id}_${date}`); const st = statusOf(p?.status ?? "none");
                      return (
                        <td key={i}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button aria-label={`${c.name} ${date}: ${st.label}`} className={cn("relative flex h-8 w-8 items-center justify-center rounded-md font-bold", cellCls(st.key))}>
                                {st.symbol}{(p?.note || p?.title) && <span className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-current" />}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 space-y-3">
                              <p className="text-sm font-semibold">{c.name} · {date}</p>
                              <div className="grid grid-cols-2 gap-1">
                                {STATUSES.map((s) => <button key={s.key} onClick={() => savePost(c.id, date, { status: s.key })} className={cn("rounded-md px-2 py-1 text-left text-xs", cellCls(s.key), st.key === s.key && "ring-2 ring-foreground")}><b className="mr-1">{s.symbol}</b>{s.label}</button>)}
                              </div>
                              <div className="space-y-1"><Label className="text-xs">Titel</Label><Input defaultValue={p?.title ?? ""} onBlur={(e) => e.target.value !== (p?.title ?? "") && savePost(c.id, date, { title: e.target.value })} /></div>
                              <div className="space-y-1"><Label className="text-xs">Notitie / link</Label><Input defaultValue={p?.note ?? ""} onBlur={(e) => e.target.value !== (p?.note ?? "") && savePost(c.id, date, { note: e.target.value })} /></div>
                            </PopoverContent>
                          </Popover>
                        </td>);
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {weekly.length > 0 && (
            <section className="space-y-3 rounded-lg bg-card p-4">
              <h2 className="text-lg font-semibold">Per week</h2>
              <div className="overflow-x-auto">
                <table className="text-xs">
                  <thead><tr><th className="min-w-40 px-2 text-left font-medium text-muted-foreground">Klant</th>{mondays.map((d) => <th key={ymd(d)} className="min-w-44 px-1 text-left font-medium text-muted-foreground">Week van {d.getDate()} {d.toLocaleString("nl-NL", { month: "short" })}</th>)}</tr></thead>
                  <tbody>
                    {weekly.map((c) => (
                      <tr key={c.id}>
                        <td className="px-2 font-medium">{c.name}<span className="ml-1 text-muted-foreground">/{c.weekly_target}</span></td>
                        {mondays.map((d) => {
                          const ws = ymd(d); const items = weekItems(weeks.get(`${c.id}_${ws}`));
                          const done = items.filter((i) => i.status === "scheduled").length;
                          return (
                            <td key={ws} className="p-1">
                              <div className={cn("flex flex-wrap items-center gap-1 rounded-md p-1", c.weekly_target > 0 && done >= c.weekly_target ? "bg-primary/40" : "bg-background")}>
                                {items.map((it, idx) => { const st = statusOf(it.status); return (
                                  <Popover key={it.id}>
                                    <PopoverTrigger asChild><button title={it.title || st.label} className={cn("flex h-7 w-7 items-center justify-center rounded font-bold", cellCls(st.key))}>{st.symbol}</button></PopoverTrigger>
                                    <PopoverContent className="w-72 space-y-3">
                                      <p className="text-sm font-semibold">{c.name} · video {idx + 1}</p>
                                      <div className="grid grid-cols-2 gap-1">{WEEKLY.map((s) => { const x = statusOf(s); return <button key={s} onClick={() => saveWeek(c.id, ws, items.map((v, j) => j === idx ? { ...v, status: s } : v))} className={cn("rounded-md px-2 py-1 text-left text-xs", cellCls(s), it.status === s && "ring-2 ring-foreground")}><b className="mr-1">{x.symbol}</b>{s === "scheduled" ? "Afgeleverd" : x.label}</button>; })}</div>
                                      <div className="space-y-1"><Label className="text-xs">Titel</Label><Input defaultValue={it.title} onBlur={(e) => e.target.value !== it.title && saveWeek(c.id, ws, items.map((v, j) => j === idx ? { ...v, title: e.target.value } : v))} /></div>
                                      <div className="space-y-1"><Label className="text-xs">Notitie / link</Label><Input defaultValue={it.note} onBlur={(e) => e.target.value !== it.note && saveWeek(c.id, ws, items.map((v, j) => j === idx ? { ...v, note: e.target.value } : v))} /></div>
                                      <button onClick={() => saveWeek(c.id, ws, items.filter((_, j) => j !== idx))} className="inline-flex items-center gap-1 text-xs text-destructive"><Trash2 className="h-3 w-3" />Verwijderen</button>
                                    </PopoverContent>
                                  </Popover>); })}
                                <button aria-label="Video toevoegen" onClick={() => saveWeek(c.id, ws, [...items, { id: crypto.randomUUID(), title: "", status: "in_progress", note: "" }])} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-card"><Plus className="h-3 w-3" /></button>
                              </div>
                            </td>);
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
