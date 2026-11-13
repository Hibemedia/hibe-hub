import { Tag } from "@/components/ui/tag";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/StatsOverview";
import { Skeleton } from "@/components/ui/skeleton";

type Post = { id: string; date: string | null; networks: string[]; text: string; image: string | null };
const NET: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube", threads: "Threads", twitter: "X", pinterest: "Pinterest", gmb: "Google" };

/** Read-only list of posts scheduled in Metricool for the selected client. */
export default function Planning() {
  const { clientId } = useClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["planning", clientId],
    enabled: !!clientId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("metricool-proxy", { headers: { apiDef: "scheduledPosts" }, body: { client_id: clientId } });
      if (error) throw error;
      return (data?.posts ?? []) as Post[];
    },
  });
  const days = new Map<string, Post[]>();
  for (const p of data ?? []) { const k = p.date?.slice(0, 10) ?? "onbekend"; days.set(k, [...(days.get(k) ?? []), p]); }
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <PageHeader title="Planning" />
      <p className="text-sm text-muted-foreground">Ingeplande posts voor de komende 60 dagen.</p>
      {isLoading ? <Skeleton className="h-60 rounded-lg" /> : isError ? <EmptyState text="De planning kon niet worden geladen. Probeer het later opnieuw." />
        : !data?.length ? <EmptyState text="Er staan nog geen posts ingepland. Zodra HIBE iets inplant, zie je het hier." /> : (
        [...days].map(([day, posts]) => (
          <section key={day} className="space-y-2">
            <h2 className="text-sm font-semibold capitalize">{day === "onbekend" ? "Datum onbekend" : new Date(`${day}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {posts.map((p) => (
                <li key={p.id} className="flex gap-3 p-3">
                  <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <ImageOff className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="inline-flex items-center gap-1 font-medium tabular"><CalendarClock className="h-3.5 w-3.5" />{p.date ? p.date.slice(11, 16) : "–"}</span>
                      {p.networks.map((n) => <Tag key={n} className="">{NET[n] ?? n}</Tag>)}
                    </div>
                    <p className="mt-1 line-clamp-2 break-words text-sm">{p.text || "Zonder tekst"}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
