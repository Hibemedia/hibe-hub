import { Link } from "react-router-dom";
import { ArrowUpRight, Film } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useBase } from "@/lib/paths";
import { useVideoItems } from "@/hooks/useVideos";
import { VIDEO_STATUS_LABEL, isClientVisible } from "@/lib/videos";
import { EmptyState } from "@/components/StatsOverview";

export default function ClientVideos() {
  const { clientId } = useClient();
  const base = useBase();
  const { data = [], isLoading } = useVideoItems(clientId);
  // In the HIBE client scope admins see everything via RLS; show the same set the client sees.
  const items = data.filter((i) => isClientVisible(i.status) && i.current_version > 0);
  const open = items.filter((i) => i.status === "client_review");
  const done = items.filter((i) => i.status !== "client_review");
  const Grid = ({ list }: { list: typeof items }) => (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((i) => (
        <li key={i.id}>
          <Link to={`${base}/videos/${i.id}`} className="flex h-full flex-col gap-3 rounded-[20px] bg-card p-3 transition-colors hover:bg-popover">
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-foreground text-background"><Film className="h-8 w-8" strokeWidth={1.4} /></div>
            <div className="flex items-start justify-between gap-2 px-2 pb-2">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-1.5"><span className={`chip ${i.status === "client_review" ? "bg-lime text-lime-foreground" : ""}`}>{VIDEO_STATUS_LABEL[i.status]}</span><span className="chip">V{i.current_version}</span></div>
                <p className="line-clamp-2 text-xl font-semibold leading-snug">{i.title}</p>
              </div>
              <span className="round-btn"><ArrowUpRight className="h-4 w-4" /></span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <h1 className="wordmark">Video's</h1>
      {isLoading ? <section className="rounded-[20px] bg-card"><EmptyState text="Laden…" /></section> : (
        <>
          <section className="space-y-3"><h2 className="text-xl font-semibold">Ter controle <span className="text-muted-foreground tabular">{open.length}</span></h2>
            {open.length ? <Grid list={open} /> : <div className="rounded-[20px] bg-card"><EmptyState text="Er staan nu geen video's voor je klaar om te bekijken." /></div>}</section>
          {done.length > 0 && <section className="space-y-3"><h2 className="text-xl font-semibold">Afgehandeld</h2><Grid list={done} /></section>}
        </>
      )}
    </div>
  );
}
