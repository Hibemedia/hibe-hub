import { Tag } from "@/components/ui/tag";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, Download, ImageOff, Loader2, Play } from "lucide-react";
import { PrimaryAction } from "@/components/PageHeader";
import { buildPlanningPdf, type Results } from "@/lib/planning-pdf";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/StatsOverview";
import { Skeleton } from "@/components/ui/skeleton";

type Post = { id: string; date: string | null; networks: string[]; text: string; image: string | null; video?: string | null };
const NET: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube", threads: "Threads", twitter: "X", pinterest: "Pinterest", gmb: "Google" };

/** Read-only list of posts scheduled in Metricool for the selected client. */
export default function Planning() {
  const { clientId, client } = useClient();
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
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
      {!!data?.length && (
        <PrimaryAction icon={busy ? Loader2 : Download} disabled={busy} onClick={async () => {
          setBusy(true);
          try {
            let results: Results | undefined;
            if (clientId && !client?.video_only) {
              const iso = (d: Date) => d.toISOString().slice(0, 10); const now = Date.now();
              const to = iso(new Date(now - 86400000)), from = iso(new Date(now - 30 * 86400000)), pFrom = iso(new Date(now - 60 * 86400000));
              const [{ data: st }, { data: pr }, { data: vids }] = await Promise.all([
                supabase.from("daily_stats").select("date,network,views,reach,interactions,posts,followers").eq("client_id", clientId).gte("date", from).lte("date", to).order("date"),
                supabase.from("daily_stats").select("views").eq("client_id", clientId).gte("date", pFrom).lt("date", from),
                supabase.from("videos").select("title,network,views,likes,published_at").eq("client_id", clientId).gte("published_at", from).order("views", { ascending: false, nullsFirst: false }).limit(5),
              ]);
              const sum = (k: "views" | "reach" | "interactions" | "posts") => (st ?? []).reduce((a, r) => a + Number(r[k] ?? 0), 0);
              const last = new Map<string, number>(); for (const r of st ?? []) if (r.followers != null) last.set(r.network, r.followers);
              if (st?.length) results = { from, to, views: sum("views"), reach: sum("reach"), interactions: sum("interactions"), posts: sum("posts"),
                followers: last.size ? [...last.values()].reduce((a, b) => a + b, 0) : null, prevViews: (pr ?? []).reduce((a, r) => a + Number(r.views ?? 0), 0), top: vids ?? [] };
              if (results && st) {
                const byDay = new Map<string, number>(), byNet = new Map<string, number>(), wdS = Array(7).fill(0), wdN = Array(7).fill(0);
                for (const r of st) { const v = Number(r.views ?? 0); byDay.set(r.date, (byDay.get(r.date) ?? 0) + v); byNet.set(r.network, (byNet.get(r.network) ?? 0) + v); }
                for (const [d, v] of byDay) { const w = new Date(`${d}T12:00:00`).getDay(); wdS[w] += v; wdN[w]++; }
                results.daily = [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([date, views]) => ({ date, views }));
                results.channels = [...byNet].sort((a, b) => b[1] - a[1]).map(([network, views]) => ({ network, views }));
                results.weekdays = wdS.map((v, i) => (wdN[i] ? v / wdN[i] : 0));
              }
            }
            const todayIso = new Date().toISOString().slice(0, 10);
            const { data: mom } = clientId ? await supabase.from("content_moments").select("title,date,start_time,location,type,status").eq("client_id", clientId).gte("date", todayIso).not("status", "in", "(geannuleerd,aangevraagd,afgewezen)").order("date").limit(6) : { data: [] };
            const blob = await buildPlanningPdf(client?.name ?? "Planning", data, results, mom ?? []);
            const url = URL.createObjectURL(blob); const a = document.createElement("a");
            a.href = url; a.download = `HIBE overzicht ${client?.name ?? ""}.pdf`.trim(); document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 30_000);
          } catch { toast.error("Overzicht kon niet worden gemaakt"); } finally { setBusy(false); }
        }}>{busy ? "Bezig…" : "Download overzicht"}</PrimaryAction>
      )}
      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-md p-2">
          <DialogTitle className="sr-only">Video</DialogTitle>
          {playing && <video src={playing} controls autoPlay playsInline className="max-h-[80vh] w-full rounded-md bg-foreground" />}
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground">Ingeplande posts voor de komende 60 dagen.</p>
      {isLoading ? <Skeleton className="h-60 rounded-lg" /> : isError ? <EmptyState text="De planning kon niet worden geladen. Probeer het later opnieuw." />
        : !data?.length ? <EmptyState text="Er staan nog geen posts ingepland. Zodra HIBE iets inplant, zie je het hier." /> : (
        [...days].map(([day, posts]) => (
          <section key={day} className="space-y-2">
            <h2 className="text-sm font-semibold capitalize">{day === "onbekend" ? "Datum onbekend" : new Date(`${day}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {posts.map((p) => (
                <li key={p.id} className="flex gap-3 p-3">
                  <div className="flex h-24 w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {p.video ? (
                      <button type="button" onClick={() => setPlaying(p.video!)} className="group relative h-full w-full" aria-label="Video afspelen">
                        <video src={`${p.video}#t=0.5`} poster={p.image ?? undefined} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-foreground/10 group-hover:bg-foreground/20"><Play className="h-4 w-4 fill-background text-background" /></span>
                      </button>
                    ) : p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <ImageOff className="h-4 w-4 text-muted-foreground" />}
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
