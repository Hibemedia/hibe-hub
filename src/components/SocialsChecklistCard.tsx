import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Section, EmptyState } from "@/components/StatsOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideoItems } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";
import { openChecklistRows } from "@/lib/dashboard-view";
import { Button } from "@/components/ui/button";
import {
  callSocials, cellCls, socialPreviewRows, statusOf, useSocialVideoLinks, useSocialEdits, weekDates,
  type Post, type SClient, type Week,
} from "@/lib/socials";

const MAX_ROWS = 6;

/** Small dashboard preview: one line per client, open work first, click through to the full checklist. */
export function SocialsChecklistPreview({ className }: { className?: string }) {
  const ds = useMemo(() => weekDates(new Date()), []);
  const { data, isLoading, error } = useQuery({
    queryKey: ["socials", "preview", ds[0]],
    queryFn: () => callSocials<{ clients: SClient[]; posts: Post[]; weeks: Week[] }>({ action: "load", from: ds[0], to: ds[6], weekFrom: ds[0] }),
    refetchInterval: 60_000,
  });
  const { data: links = [] } = useSocialVideoLinks();
  const { data: videos = [] } = useVideoItems();
  const { data: edits = [] } = useSocialEdits();
  const p = useMemo(
    () => {
      const all = socialPreviewRows(data?.clients ?? [], data?.posts ?? [], data?.weeks ?? [], links, videos, ds, ds[0], Number.MAX_SAFE_INTEGER, edits);
      const open = openChecklistRows(all.rows);
      return { ...all, rows: open.slice(0, MAX_ROWS), hidden: Math.max(0, open.length - MAX_ROWS) };
    },
    [data, links, videos, edits, ds],
  );

  return (
    <Section title="Socials-checklist" className={className} aside={
      <div className="flex items-center gap-2.5">
        {!isLoading && !error && <span className="hidden text-xs tabular text-muted-foreground sm:inline"><b className="text-foreground">{p.done}</b> van {p.planned} ingepland deze week</span>}
        <Button asChild variant="outline" size="sm" className="text-xs"><Link to="/hibe/socials">Volledige checklist<ArrowUpRight /></Link></Button>
      </div>
    }>
      {isLoading ? <Skeleton className="h-28 rounded-lg" /> : error ? <EmptyState text="De checklist kon niet worden geladen." /> : p.rows.length === 0 ? <p className="text-sm text-muted-foreground">Alles is ingepland.</p> : (
        <>
          <ul className="space-y-0.5">
            {p.rows.map((r) => (
              <li key={r.id}>
                <Link to="/hibe/socials" className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-popover">
                  <span className="w-24 shrink-0 break-words text-sm md:w-40" title={r.name}>{r.name}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex w-[122px] shrink-0 gap-1" aria-hidden>
                      {r.cells.slice(0, 7).map((c, i) => (
                        <span key={i} title={`${statusOf(c.status).label}${c.linked ? " · video gekoppeld" : ""}`}
                          className={cn("h-3.5 w-3.5 shrink-0 rounded-[3px] border border-border", c.status === "none" ? "bg-muted" : cellCls(c.status))} />
                      ))}
                    </span>
                    <span className="hidden h-1.5 min-w-0 flex-1 overflow-hidden rounded-tag bg-muted sm:block" aria-hidden>
                      <span className={cn("block h-full", r.target > 0 && r.done >= r.target ? "bg-success" : "bg-lime")}
                        style={{ width: `${r.target > 0 ? Math.min(100, (r.done / r.target) * 100) : 0}%` }} />
                    </span>
                  </span>
                  <span className={cn("w-10 shrink-0 text-right text-xs tabular", r.open ? "text-foreground" : "text-muted-foreground")}>{r.target > 0 ? `${r.done}/${r.target}` : "–"}</span>
                </Link>
              </li>
            ))}
          </ul>
          {p.hidden > 0 && <Link to="/hibe/socials" className="mt-1.5 inline-block px-2 text-xs text-muted-foreground transition-colors hover:text-foreground">en nog {p.hidden} klanten →</Link>}
        </>
      )}
    </Section>
  );
}
