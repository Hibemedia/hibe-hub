import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Section, EmptyState } from "@/components/StatsOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialsWeekGrid } from "@/components/SocialsWeekGrid";
import { useVideoItems } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";
import {
  callSocials, cellCls, socialPreviewRows, statusOf, useSocialVideoLinks, weekDates,
  type Post, type SClient, type Week,
} from "@/lib/socials";

const MAX_ROWS = 6;

/** Week view of the Review Hub checklist, live from the same rows. */
export function SocialsChecklistCard({ className, weekOnly }: { className?: string; weekOnly?: boolean }) {
  return (
    <Section title="Socials-checklist" className={className} aside={
      <Link to="/hibe/socials" className="chip-filter h-8 gap-1 px-3 text-xs">Volledige checklist<ArrowUpRight className="h-3.5 w-3.5" /></Link>
    }>
      <SocialsWeekGrid weekOnly={weekOnly} />
    </Section>
  );
}

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
  const p = useMemo(
    () => socialPreviewRows(data?.clients ?? [], data?.posts ?? [], data?.weeks ?? [], links, videos, ds, ds[0], MAX_ROWS),
    [data, links, videos, ds],
  );

  return (
    <Section title="Socials-checklist" className={className} aside={
      <div className="flex items-center gap-2.5">
        {!isLoading && !error && <span className="hidden text-xs tabular text-muted-foreground sm:inline"><b className="text-foreground">{p.done}</b> van {p.planned} ingepland deze week</span>}
        <Link to="/hibe/socials" className="chip-filter h-8 gap-1 px-3 text-xs">Volledige checklist<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
    }>
      {isLoading ? <Skeleton className="h-28 rounded-lg" /> : error ? <EmptyState text="De checklist kon niet worden geladen." /> : p.rows.length === 0 ? <EmptyState text="Nog geen klanten in de checklist." /> : (
        <>
          <ul className="space-y-0.5">
            {p.rows.map((r) => (
              <li key={r.id}>
                <Link to="/hibe/socials" className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-popover">
                  <span className="w-24 shrink-0 truncate text-sm md:w-40" title={r.name}>{r.name}</span>
                  <span className="flex min-w-0 gap-1" aria-hidden>
                    {r.cells.slice(0, 7).map((c, i) => (
                      <span key={i} title={`${statusOf(c.status).label}${c.linked ? " · video gekoppeld" : ""}`}
                        className={cn("h-3.5 w-3.5 shrink-0 rounded-[3px]", c.status === "none" ? "bg-muted" : cellCls(c.status))} />
                    ))}
                  </span>
                  <span className={cn("ml-auto shrink-0 text-xs tabular", r.open ? "text-foreground" : "text-muted-foreground")}>{r.done}/{r.target}</span>
                </Link>
              </li>
            ))}
          </ul>
          {p.hidden > 0 && <Link to="/hibe/socials" className="mt-1.5 inline-block px-2 text-xs text-muted-foreground transition-colors hover:text-foreground">en nog {p.hidden} klanten →</Link>}
          <p className="mt-3 text-xs text-muted-foreground">Elk vakje is een post of edit van deze week · klik voor statussen, titels en koppelingen.</p>
        </>
      )}
    </Section>
  );
}
