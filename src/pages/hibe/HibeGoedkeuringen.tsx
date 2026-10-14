import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { ReviewItem, ReviewStatus, REVIEW_STATUS_LABEL } from "@/hooks/useReviews";
import { ReviewDialog, CreateDialog, StatusLabel, ItemThumb, netInfo, fmtDate } from "@/pages/VideoApproval";
import { EmptyState } from "@/components/StatsOverview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const STATUSES: (ReviewStatus | "all")[] = ["all", "pending", "changes_requested", "approved", "rejected"];

export default function HibeGoedkeuringen() {
  const { clients } = useClient();
  const [client, setClient] = useState("all");
  const [status, setStatus] = useState<ReviewStatus | "all">("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pick, setPick] = useState<null | "choose" | string>(null);
  const [chosen, setChosen] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["review-items", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("review_items")
        .select("id,client_id,title,caption,planned_date,networks,status,source,storage_path,external_link,metricool_post_id,created_at")
        .order("planned_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as ReviewItem[];
    },
  });
  const list = items.filter((i) => (client === "all" || i.client_id === client) && (status === "all" || i.status === status));
  const selected = items.find((i) => i.id === openId) ?? null;
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "Klant";

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="wordmark">Goedkeuringen</h1>
        <button onClick={() => { setChosen(client !== "all" ? client : ""); setPick("choose"); }} className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-2 pr-5 text-sm font-medium text-background">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><Plus className="h-4 w-4" /></span>Video klaarzetten
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger aria-label="Filter op klant" className="h-9 w-auto min-w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle klanten</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        {STATUSES.map((s) => (
          <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)} className="chip-filter shrink-0">
            {s === "all" ? "Alle" : REVIEW_STATUS_LABEL[s]} <span className="ml-1.5 text-muted-foreground tabular">{items.filter((i) => (client === "all" || i.client_id === client) && (s === "all" || i.status === s)).length}</span>
          </button>
        ))}
      </div>

      {isLoading ? <section className="rounded-lg bg-card"><EmptyState text="Laden…" /></section> : list.length === 0 ? (
        <section className="rounded-lg bg-card"><EmptyState text="Geen items met dit filter." /></section>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <li key={i.id} className="relative">
              <button onClick={() => setOpenId(i.id)} className="flex w-full flex-col gap-4 rounded-lg bg-card p-3 text-left transition-colors hover:bg-popover">
                <ItemThumb item={i} />
                <div className="px-2 pb-2">
                  <div className="mb-2 flex flex-wrap gap-1.5"><StatusLabel status={i.status} /><span className="chip">{name(i.client_id)}</span></div>
                  <p className="line-clamp-2 text-xl font-semibold leading-snug">{i.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fmtDate(i.planned_date)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{i.networks.map((n) => <span key={n} className="chip">{netInfo(n).label}</span>)}</div>
                </div>
              </button>
              <span aria-hidden className="round-btn pointer-events-none absolute right-6 top-6"><ArrowUpRight className="h-4 w-4" /></span>
            </li>
          ))}
        </ul>
      )}

      {selected && <ReviewDialog item={selected} onClose={() => setOpenId(null)} />}
      {pick === "choose" && (
        <Dialog open onOpenChange={(o) => !o && setPick(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Voor welke klant?</DialogTitle></DialogHeader>
            <Label className="sr-only">Klant</Label>
            <Select value={chosen} onValueChange={setChosen}>
              <SelectTrigger aria-label="Kies klant"><SelectValue placeholder="Kies een klant" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!chosen} onClick={() => setPick(chosen)}>Verder</Button>
          </DialogContent>
        </Dialog>
      )}
      {pick && pick !== "choose" && <CreateDialog clientId={pick} onClose={() => setPick(null)} />}
    </div>
  );
}
