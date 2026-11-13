import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useClient } from "@/context/ClientContext";
import { useBase } from "@/lib/paths";
import { useVideoBoard, BoardItem } from "@/hooks/useVideos";
import { VideoThumb } from "@/components/videos/parts";
import { EmptyState } from "@/components/StatsOverview";
import { Button } from "@/components/ui/button";
import { useViewAs } from "@/context/ViewAs";
import { isClientVisible } from "@/lib/videos";
import { ClientVideoArchive } from "@/components/videos/ClientVideoArchive";

/** Klant-startscherm: what waits for review, then all own videos in three groups. */
export default function ClientVideos() {
  const { clientId } = useClient();
  const base = useBase();
  const { data = [], isLoading } = useVideoBoard({ includeDone: true });
  const viewAs = useViewAs();
  const items = data.filter((i) => i.client_id === clientId && !i.archived_at && i.current_version > 0 && (!viewAs || isClientVisible(i.status)));
  const todo = items.filter((i) => i.status === "client_review");
  const changes = items.filter((i) => i.status === "feedback");
  const approved = items.filter((i) => ["approved_client", "scheduled"].includes(i.status));

  const Group = ({ title, list, note, empty }: { title: string; list: BoardItem[]; note?: string; empty: string }) => (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title} <span className="text-muted-foreground tabular">{list.length}</span></h2>
      {note && list.length > 0 && <p className="text-sm text-muted-foreground">{note}</p>}
      {list.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {list.map((i) => (
            <li key={i.id}><Link to={`${base}/videos/${i.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
              <VideoThumb versionId={i.versionId} className="h-14 w-8" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{i.title}</span><span className="text-xs text-muted-foreground">Versie {i.current_version}</span></span>
            </Link></li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <PageHeader title="Video's" />
      {isLoading ? <EmptyState text="Laden…" /> : (
        <>
          <section className="space-y-4 rounded-lg bg-foreground p-5 text-background">
            <p className="text-xl font-semibold">{todo.length === 0 ? "Er wacht niets op jouw beoordeling" : `${todo.length} video${todo.length === 1 ? "" : "'s"} wacht${todo.length === 1 ? "" : "en"} op jouw beoordeling`}</p>
            {todo.length > 0 ? (
              <>
                <div className="flex gap-2 overflow-x-auto">{todo.slice(0, 8).map((i) => <VideoThumb key={i.id} versionId={i.versionId} className="h-20 w-[45px]" />)}</div>
                <Button asChild className="w-full bg-lime text-lime-foreground hover:bg-lime/90 sm:w-auto"><Link to={`${base}/videos/beoordelen`}><Play />Start beoordelen</Link></Button>
              </>
            ) : <p className="text-sm text-background/70">Zodra HIBE nieuwe video's klaarzet, verschijnen ze hier.</p>}
          </section>
          <Group title="Te beoordelen" list={todo} empty="Niets te beoordelen." />
          <Group title="Wijzigingen aangevraagd" list={changes} note="HIBE is ermee bezig." empty="Geen openstaande wijzigingen. HIBE is ermee bezig zodra je wijzigingen vraagt." />
          <Group title="Goedgekeurd" list={approved} empty="Nog geen goedgekeurde video's." />
          <ClientVideoArchive />
        </>
      )}
    </div>
  );
}
