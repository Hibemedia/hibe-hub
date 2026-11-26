import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

type Row = { id: string; network: string; title: string | null; views: number | null; published_at: string | null; url: string | null; thumbnail_url: string | null };
const PAGE = 20;
const NET: Record<string, string> = { ig: "Instagram", instagram: "Instagram", tt: "TikTok", tiktok: "TikTok", yt: "YouTube", youtube: "YouTube", fb: "Facebook", facebook: "Facebook", li: "LinkedIn", linkedin: "LinkedIn" };
const net = (n: string) => NET[n.toLowerCase()] ?? n;
const fmt = (n: number | null) => (n ?? 0).toLocaleString("nl-NL");

/** Posted social videos (synced stats), best viewed first — read-only, client-scoped by RLS. */
export function PostedSocialVideos() {
  const { clientId } = useClient();
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["posted-social-videos", clientId], enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("id,network,title,views,published_at,url,thumbnail_url")
        .eq("client_id", clientId!).order("views", { ascending: false, nullsFirst: false }).limit(500);
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      const stored = rows.filter((v) => v.thumbnail_url?.startsWith("storage:thumbnails/"));
      if (stored.length) {
        const { data: signed } = await supabase.storage.from("thumbnails").createSignedUrls(stored.map((v) => v.thumbnail_url!.slice("storage:thumbnails/".length)), 3600);
        stored.forEach((v, i) => { v.thumbnail_url = signed?.[i]?.signedUrl ?? null; });
      }
      return rows;
    },
  });
  const shown = data.filter((v) => (v.title ?? "").toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  return (
    <section className="min-w-0 space-y-3" aria-label="Geplaatst op socials">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold"><Share2 className="h-4 w-4 shrink-0" /><span className="truncate">Geplaatst op socials</span><span className="tabular text-muted-foreground">{data.length}</span></h2>
        {data.length > 0 && <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Zoek in geplaatste video's" placeholder="Zoek op titel" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} className="pl-9" /></div>}
      </div>
      {data.length > 0 && <p className="text-sm text-muted-foreground">Al je geposte video's, best bekeken bovenaan.</p>}
      {isLoading || isError || shown.length === 0 ? <p className="text-sm text-muted-foreground">{isLoading ? "Laden…" : isError ? "De geplaatste video's konden niet worden geladen." : data.length ? "Geen video's gevonden." : "Zodra HIBE je kanalen koppelt, verschijnen je geposte video's hier."}</p> : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {shown.slice(0, limit).map((v, i) => (
              <li key={v.id} className="flex items-center gap-3 p-3">
                <span className="w-5 shrink-0 text-right text-xs tabular text-muted-foreground">{i + 1}</span>
                {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" loading="lazy" className="h-14 w-8 shrink-0 rounded-[4px] bg-muted object-cover" /> : <span className="h-14 w-8 shrink-0 rounded-[4px] bg-muted" />}
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium">{v.title || "Zonder titel"}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><Tag>{net(v.network)}</Tag>{v.published_at && new Date(v.published_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</span>
                </span>
                <span className="shrink-0 text-right"><span className="block text-sm font-semibold tabular">{fmt(v.views)}</span><span className="text-xs text-muted-foreground">weergaven</span></span>
                {v.url && <Button asChild variant="outline" size="icon" className="shrink-0"><a href={v.url} target="_blank" rel="noreferrer" aria-label={`Bekijk ${v.title ?? "video"} op ${net(v.network)}`}><ExternalLink className="h-4 w-4" /></a></Button>}
              </li>
            ))}
          </ul>
          {shown.length > limit && <Button variant="outline" onClick={() => setLimit(limit + PAGE)}>Meer tonen ({shown.length - limit})</Button>}
        </>
      )}
    </section>
  );
}
