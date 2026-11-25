import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Skeleton } from "@/components/ui/skeleton";
import { upcomingDashboardMoments } from "@/lib/dashboard-view";
import { normalizeMomentStatus } from "@/lib/content-moment-list";
import { CONTENT_MOMENT_PHOTOS, DEFAULT_CONTENT_MOMENT_PHOTO } from "@/lib/content-moment-photos";
import { MOMENT_STATUS, type Moment } from "@/pages/ContentMoments";

export function UpcomingContent() {
  const { clients } = useClient();
  const { data: moments = [], isLoading, isError } = useQuery({ queryKey: ["content-moments", "all"], queryFn: async () => {
    const { data, error } = await supabase.from("content_moments").select("*").order("date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as Moment[];
  } });
  const upcoming = upcomingDashboardMoments(moments);
  const first = upcoming[0];
  const name = (m: Moment) => clients.find((c) => c.id === m.client_id)?.name ?? "Klant";
  const date = (m: Moment) => m.date ? new Date(`${m.date}T00:00:00`).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "long" }) : "";
  const photo = first ? CONTENT_MOMENT_PHOTOS[name(first)] || DEFAULT_CONTENT_MOMENT_PHOTO : null;
  return <section className="min-w-0 border-t border-border pt-4" aria-label="Komende contentmomenten">
    <header className="mb-4 flex items-center justify-between gap-2"><h2 className="min-w-0 text-lg font-semibold">Komende contentmomenten</h2><Button asChild variant="ghost" size="icon" className="h-8 w-8"><Link to="/hibe/contentmomenten" aria-label="Alle contentmomenten"><ArrowUpRight /></Link></Button></header>
    {isLoading ? <Skeleton className="h-64" /> : isError ? <p className="text-sm text-muted-foreground">Contentmomenten konden niet worden geladen.</p> : !first ? <p className="text-sm text-muted-foreground">Geen contentmomenten gepland.</p> : <>
      <Link to={`/hibe/contentmomenten?moment=${first.id}`} className="group relative isolate flex min-h-60 flex-col justify-end overflow-hidden rounded-lg bg-foreground p-5 text-background transition-opacity hover:opacity-90">
        {photo && <img src={photo} alt="" onError={(e) => { e.currentTarget.hidden = true; }} className="absolute inset-0 -z-10 h-full w-full object-cover" />}
        <span className="absolute inset-0 -z-10 bg-foreground/70" />
        <span className="mb-auto flex items-center justify-between gap-2"><Tag className="bg-card text-foreground">Eerstvolgende</Tag><CalendarDays className="h-5 w-5" /></span>
        <span className="mt-5 text-xl font-semibold">{name(first)}</span>
        <span className="mt-1 break-words text-base">{first.title}</span>
        <span className="mt-2 text-sm text-background/90">{date(first)}{first.start_time ? ` · ${first.start_time.slice(0, 5)}` : ""}</span>
        {first.location && <span className="mt-1 text-xs text-background/80">{first.location}</span>}
        <Tag variant={normalizeMomentStatus(first.status) === "aangevraagd" ? "info" : "success"} className="mt-3 self-start">{MOMENT_STATUS[normalizeMomentStatus(first.status) as keyof typeof MOMENT_STATUS]}</Tag>
      </Link>
      <ul className="mt-2 divide-y divide-border">{upcoming.slice(1).map((m) => <li key={m.id}><Button asChild variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-tag px-2 py-3"><Link to={`/hibe/contentmomenten?moment=${m.id}`} className="!no-underline"><CalendarDays className="shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold">{m.title}</span><span className="mt-1 flex flex-wrap items-center gap-2"><Tag>{name(m)}</Tag><span className="text-xs font-normal text-muted-foreground">{date(m)}{m.start_time ? ` · ${m.start_time.slice(0, 5)}` : ""}</span></span></span><ArrowUpRight /></Link></Button></li>)}</ul>
    </>}
  </section>;
}
