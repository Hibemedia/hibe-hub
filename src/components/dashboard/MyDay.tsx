import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { Skeleton } from "@/components/ui/skeleton";
import { personalFeedback } from "@/lib/dashboard-view";
import { ageTone, fmtAge } from "@/lib/videos";
import type { BoardItem } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";

type DayEdit = { id: string; title: string; client_id: string; updated_at: string; created_at: string; deadline: string | null };

export function MyDay({ me, videos, loading, className }: { me: string; videos: BoardItem[]; loading?: boolean; className?: string }) {
  const { clients } = useClient();
  const { data: edits = [], isLoading, isError } = useQuery({
    queryKey: ["my-day", "edits", me], enabled: !!me,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("edits").select("id,title,client_id,updated_at,created_at,deadline").eq("editor_id", me).neq("status", "delivered").order("deadline", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as DayEdit[];
    },
  });
  const reviews = videos.filter((v) => v.status === "internal_review").sort((a, b) => a.status_changed_at.localeCompare(b.status_changed_at));
  const feedback = personalFeedback(videos, me).sort((a, b) => a.status_changed_at.localeCompare(b.status_changed_at));
  const row = (item: { id: string; title: string; client_id: string }, since: string, to: string, action: string) => <li key={item.id}>
    <Button asChild variant="ghost" className="h-auto w-full min-w-0 justify-start whitespace-normal rounded-tag px-2 py-3"><Link to={to} className="group !no-underline">
      <span className="min-w-0 flex-1 text-left"><span className="block break-words text-sm font-semibold">{item.title}</span><span className="mt-1.5 flex flex-wrap items-center gap-2"><Tag className="max-w-full whitespace-normal">{clients.find((c) => c.id === item.client_id)?.name ?? "Klant"}</Tag><span className={cn("flex items-center gap-1 text-xs font-normal", ageTone(since) === "late" ? "text-destructive" : "text-muted-foreground")} title="Wachttijd"><Clock className="h-3 w-3" />{fmtAge(since)}</span></span></span>
      <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-tag border border-border bg-card px-2 text-xs">{action}<ArrowRight className="h-3 w-3" /></span>
    </Link></Button>
  </li>;
  const groups = [
    { title: "Te beoordelen", empty: "Niets te beoordelen.", items: reviews.map((v) => row(v, v.status_changed_at, `/hibe/videos/${v.id}`, "Beoordeel")) },
    { title: "Mijn edits", empty: "Geen open edits.", items: edits.map((e) => row(e, e.updated_at ?? e.created_at, `/hibe/edits?edit=${e.id}`, "Open")) },
    { title: "Feedback", empty: "Geen feedback voor jou.", items: feedback.map((v) => row(v, v.status_changed_at, `/hibe/videos/${v.id}`, "Open")) },
  ];
  return <section aria-label="Mijn dag" className={cn("min-w-0 border-t border-border pt-4", className)}>
    <h2 className="mb-4 text-lg font-semibold">Mijn dag</h2>
    {loading || isLoading ? <Skeleton className="h-40" /> : isError ? <p className="text-sm text-muted-foreground">Je werklijst kon niet worden geladen.</p> : <div className="divide-y divide-border">{groups.map((g) => <div key={g.title} className="py-3 first:pt-0">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">{g.title}<Tag>{g.items.length}</Tag></h3>
      {g.items.length ? <ul className="divide-y divide-border">{g.items}</ul> : <p className="py-2 text-sm text-muted-foreground">{g.empty}</p>}
    </div>)}</div>}
  </section>;
}
