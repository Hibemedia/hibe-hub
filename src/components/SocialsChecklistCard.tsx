import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState, Section } from "@/components/StatsOverview";
import { cn } from "@/lib/utils";
import {
  Post, PostStatus, SClient, STATUSES, Week, callSocials, cellCls, statusOf, weekDates, weekItems, ymd,
} from "@/lib/socials";

const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** Compact week view of the Review Hub checklist, live from the same rows. */
export function SocialsChecklistCard({ className }: { className?: string }) {
  const qc = useQueryClient();
  const now = new Date();
  const dates = weekDates(now);
  const from = dates[0], to = dates[6], today = ymd(now);
  const key = ["socials-week", from];
  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => callSocials<{ clients: SClient[]; posts: Post[]; weeks: Week[] }>({ action: "load", from, to, weekFrom: from }),
    refetchInterval: 30000,
  });
  const posts = useMemo(() => new Map((data?.posts ?? []).map((p) => [`${p.client_id}_${p.post_date}`, p])), [data]);
  const weeks = useMemo(() => new Map((data?.weeks ?? []).map((w) => [`${w.client_id}_${w.week_start}`, w])), [data]);
  const active = (data?.clients ?? []).filter((c) => c.is_active);
  const daily = active.filter((c) => c.tracking_mode !== "weekly");
  const weekly = active.filter((c) => c.tracking_mode === "weekly");

  const savePost = async (c: string, date: string, status: PostStatus) => {
    const cur = posts.get(`${c}_${date}`) ?? { client_id: c, post_date: date, status: "none" as PostStatus, note: null, title: null };
    const next: Post = { ...cur, status };
    qc.setQueryData(key, (old: any) => old && { ...old, posts: [...old.posts.filter((p: Post) => !(p.client_id === c && p.post_date === date)), next] });
    try { await callSocials({ action: "set_post", client_id: c, post_date: date, status: next.status, note: next.note || null, title: next.title || null }); }
    catch { toast.error("Kon niet opslaan"); qc.invalidateQueries({ queryKey: key }); }
  };

  const monday = new Date(from + "T00:00:00");
  const weekLabel = `${monday.getDate()} ${monday.toLocaleString("nl-NL", { month: "short" })}`;

  return (
    <Section title="Socials-checklist" className={className} aside={
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">week van {weekLabel}</span>
        <Link to="/hibe/socials" className="chip-filter h-8 gap-1 px-3 text-xs">Volledige checklist<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
    }>
      {isLoading ? <EmptyState text="Laden…" />
        : error ? <EmptyState text={"De checklist kon niet worden geladen: " + (error as Error).message} />
        : daily.length === 0 && weekly.length === 0 ? <EmptyState text="Nog geen klanten in de checklist." />
        : (
          <>
            {daily.length > 0 && (
              <div className="overflow-x-auto">
                <table className="border-separate border-spacing-0.5 text-xs">
                  <thead><tr>
                    <th className="sticky left-0 z-10 min-w-28 bg-card px-2 text-left font-medium text-muted-foreground">Klant</th>
                    {dates.map((d, i) => (
                      <th key={d} className={cn("w-8 min-w-8 font-medium", d === today ? "text-foreground underline" : "text-muted-foreground")}>
                        <div>{DAYS[i]}</div><div>{new Date(d + "T00:00:00").getDate()}</div>
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {daily.map((c) => (
                      <tr key={c.id}>
                        <td className="sticky left-0 z-10 bg-card px-2 font-medium" title={c.name}><span className="block max-w-32 truncate">{c.name}</span></td>
                        {dates.map((d) => {
                          const p = posts.get(`${c.id}_${d}`); const st = statusOf(p?.status ?? "none");
                          return (
                            <td key={d}>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button aria-label={`${c.name} ${d}: ${st.label}`} className={cn("relative flex h-7 w-7 items-center justify-center rounded-md font-bold", cellCls(st.key))}>
                                    {st.symbol}{(p?.note || p?.title) && <span className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-current" />}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 space-y-2">
                                  <p className="text-sm font-semibold">{c.name} · {d}</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {STATUSES.map((s) => <button key={s.key} onClick={() => savePost(c.id, d, s.key)} className={cn("rounded-md px-2 py-1 text-left text-xs", cellCls(s.key), st.key === s.key && "ring-2 ring-foreground")}><b className="mr-1">{s.symbol}</b>{s.label}</button>)}
                                  </div>
                                  {(p?.title || p?.note) && <p className="text-xs text-muted-foreground">{[p?.title, p?.note].filter(Boolean).join(" · ")}</p>}
                                  <Link to="/hibe/socials" className="inline-block text-xs underline">Bewerken in de volledige checklist</Link>
                                </PopoverContent>
                              </Popover>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {weekly.length > 0 && (
              <div className={cn("flex flex-wrap gap-2", daily.length > 0 && "mt-4")}>
                {weekly.map((c) => {
                  const items = weekItems(weeks.get(`${c.id}_${from}`));
                  const done = items.filter((i) => i.status === "scheduled").length;
                  return <span key={c.id} className={cn("chip", c.weekly_target > 0 && done >= c.weekly_target && "bg-lime")}>{c.name} · {done}/{c.weekly_target} afgeleverd</span>;
                })}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {STATUSES.slice(1).map((s) => <span key={s.key}><b className="mr-1 text-foreground">{s.symbol}</b>{s.label}</span>)}
            </div>
          </>
        )}
    </Section>
  );
}
