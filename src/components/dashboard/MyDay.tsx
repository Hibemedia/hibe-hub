import { Tag } from "@/components/ui/tag";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Scissors, ClipboardCheck, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls } from "@/hooks/useLogoUrl";
import { ClientMark } from "@/components/videos/parts";
import { EDIT_STATUS_LABEL, type EditStatus } from "@/lib/edits";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const db = supabase as any;
const TZ = "Europe/Amsterdam";
const dayStr = (add: number) => { const d = new Date(); d.setDate(d.getDate() + add); return d.toLocaleDateString("en-CA", { timeZone: TZ }); };

function useMyDay(me: string) {
  return useQuery({
    queryKey: ["my-day", me],
    enabled: !!me,
    queryFn: async () => {
      const today = dayStr(0), tomorrow = dayStr(1);
      const [e, v, c] = await Promise.all([
        db.from("edits").select("id,title,status,deadline,client_id").eq("editor_id", me).neq("status", "delivered").order("deadline", { ascending: true, nullsFirst: false }).limit(5),
        db.from("video_items").select("id,title,client_id,status_changed_at").eq("status", "internal_review").is("archived_at", null).order("status_changed_at", { ascending: true }).limit(5),
        db.from("moment_crew").select("moment:content_moments(id,title,date,start_time,client_id,status)").eq("user_id", me),
      ]);
      if (e.error) throw e.error; if (v.error) throw v.error; if (c.error) throw c.error;
      const moments = ((c.data ?? []) as any[]).map((r) => r.moment).filter((m) => m && (m.date === today || m.date === tomorrow) && m.status !== "geannuleerd")
        .sort((a, b) => (a.date + (a.start_time ?? "")).localeCompare(b.date + (b.start_time ?? "")));
      return { edits: e.data as any[], videos: v.data as any[], moments, today };
    },
  });
}

export function MyDay({ me, className }: { me: string; className?: string }) {
  const { clients } = useClient();
  const logos = useLogoUrls(clients.map((c) => c.logo_url));
  const { data, isLoading } = useMyDay(me);
  const client = (id: string) => clients.find((c) => c.id === id);
  const Mark = ({ id }: { id: string }) => { const c = client(id); return <ClientMark id={id} name={c?.name ?? "Klant"} url={c?.logo_url ? logos[c.logo_url] : undefined} size={26} />; };
  const Row = ({ to, id, title, sub, right }: { to: string; id: string; title: string; sub: string; right?: React.ReactNode }) => (
    <li><Link to={to} className="flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-popover">
      <Mark id={id} />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{title}</span><span className="block truncate text-xs text-muted-foreground">{sub}</span></span>
      {right}
    </Link></li>
  );
  const Col = ({ title, icon: Icon, to, children, empty }: { title: string; icon: typeof Scissors; to: string; children: React.ReactNode[]; empty: string }) => (
    <div className="min-w-0">
      <Link to={to} className="mb-2 flex min-w-0 items-center gap-2 text-sm font-semibold hover:underline"><Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{title}</span>{children.length > 0 && <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground tabular">{children.length}</span>}</Link>
      {children.length ? <ul className="-mx-2 space-y-0.5">{children}</ul> : <p className="px-0.5 py-1.5 text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
  return (
    <section className={cn("min-w-0 rounded-lg bg-card p-5 md:p-6", className)}>
      <h2 className="mb-4 truncate text-xl font-semibold tracking-tight md:text-2xl">Mijn dag</h2>
      {isLoading || !data ? <Skeleton className="h-28 rounded-lg" /> : (
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          <Col title="Mijn edits" icon={Scissors} to="/hibe/edits" empty="Niets te doen">
            {data.edits.map((e) => <Row key={e.id} to="/hibe/edits" id={e.client_id} title={e.title} sub={`${client(e.client_id)?.name ?? "Klant"}${e.deadline ? ` · ${new Date(e.deadline + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}` : ""}`}
              right={<Tag className="shrink-0 rounded-tag bg-muted px-2 py-0.5 text-[11px] font-medium">{EDIT_STATUS_LABEL[e.status as EditStatus] ?? e.status}</Tag>} />)}
          </Col>
          <Col title="Te beoordelen" icon={ClipboardCheck} to="/hibe/videos/stap/interne-controle" empty="Niets te beoordelen">
            {data.videos.map((v) => <Row key={v.id} to={`/hibe/videos/${v.id}`} id={v.client_id} title={v.title} sub={client(v.client_id)?.name ?? "Klant"} />)}
          </Col>
          <Col title="Vandaag" icon={CalendarClock} to="/hibe/agenda" empty="Geen draaidagen vandaag of morgen">
            {data.moments.map((m) => <Row key={m.id} to="/hibe/contentmomenten" id={m.client_id} title={m.title} sub={`${m.date === data.today ? "Vandaag" : "Morgen"}${m.start_time ? ` ${String(m.start_time).slice(0, 5)}` : ""} · ${client(m.client_id)?.name ?? "Klant"}`} />)}
          </Col>
        </div>
      )}
    </section>
  );
}
