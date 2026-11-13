import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls } from "@/hooks/useLogoUrl";
import { Skeleton } from "@/components/ui/skeleton";

type ReviewHighlight = { id: string; title: string; client_id: string };

function ClientLogo({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-popover text-xs font-semibold text-muted-foreground">{name.slice(0, 1)}</span>;
  return <img src={url} alt="" onError={() => setFailed(true)} className="h-8 w-8 shrink-0 rounded-full bg-popover object-contain p-1" />;
}

export function DashboardHighlights() {
  const { clients } = useClient();
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ["dashboard", "next-internal-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("video_items").select("id,title,client_id")
        .eq("status", "internal_review").is("archived_at", null)
        .order("status_changed_at", { ascending: true }).order("id").limit(3);
      if (error) throw error;
      return (data ?? []) as ReviewHighlight[];
    },
  });
  const clientOf = (id: string) => clients.find((c) => c.id === id);

  return (
    <section className="min-w-0 rounded-lg bg-card p-5 md:p-6" aria-label="Eerstvolgende te beoordelen">
      <h2 className="truncate text-sm font-medium text-muted-foreground" title="Eerstvolgende te beoordelen">Eerstvolgende te beoordelen</h2>
      {isLoading ? (
        <div className="mt-3 space-y-2"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>
      ) : reviews.length ? (
        <ul className="mt-3 divide-y divide-border">
          {reviews.map((r) => {
            const client = clientOf(r.client_id);
            const name = client?.name ?? "Klant";
            const logo = client?.logo_url ? logos[client.logo_url] : undefined;
            return (
              <li key={r.id}>
                <Link to={`/hibe/videos/${r.id}`} className="group flex min-w-0 items-center gap-3 py-2.5">
                  <ClientLogo url={logo} name={name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold group-hover:underline">{r.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{name}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-5 text-sm text-muted-foreground">{isError ? "Beoordelingen konden niet worden geladen." : "Niets te beoordelen."}</p>
      )}
    </section>
  );
}
