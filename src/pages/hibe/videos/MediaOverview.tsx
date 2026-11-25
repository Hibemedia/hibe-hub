import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Upload, Send, ArrowUpDown, ArrowRight, Search, Clock, Check } from "lucide-react";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { useMedia, useSavedFilters, useUploader } from "@/components/videos/useMedia";
import { MediaTabs } from "@/components/videos/MediaTabs";
import { VideoThumb } from "@/components/videos/parts";
import { useSendToClient } from "@/components/videos/SendDialog";
import { UploadProgress } from "@/components/UploadProgress";
import { useVideoActivity, useOpenClientFeedback } from "@/hooks/useVideos";
import { STEPS, VIDEO_STATUS_LABEL, VideoStatus, ageTone, fmtAge, clientsReadyToSend } from "@/lib/videos";
import { filterMedia } from "@/lib/media-overview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, type TagVariant } from "@/components/ui/tag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const KIND = { upload: "uploadde", approved: "keurde goed", feedback: "gaf feedback op", sent: "Verstuurd naar klant:" };
const BADGE: Record<VideoStatus, TagVariant> = { internal_review: "neutral", feedback: "danger", approved_internal: "success", ready_for_client: "info", client_review: "warning", approved_client: "success", scheduled: "success", archived: "neutral" };

export default function MediaOverview() {
  const [params, setParams] = useSearchParams();
  const m = useMedia();
  const [f, setF] = useSavedFilters();
  const up = useUploader(f.client === "all" ? undefined : f.client);
  const sender = useSendToClient();
  const { data: activity = [] } = useVideoActivity(m.live);
  const { data: openFb = new Set<string>() } = useOpenClientFeedback();
  const [sort, setSort] = useState<{ key: VideoStatus | "total" | "name"; dir: 1 | -1 }>({ key: "total", dir: -1 });
  const filesRef = useRef<HTMLElement>(null);
  const rawPhase = params.get("phase") ?? params.get("status") ?? "all";
  const phase = rawPhase === "running" || rawPhase in VIDEO_STATUS_LABEL ? rawPhase : "all";
  const setPhase = (value: string) => setParams((previous) => { const next = new URLSearchParams(previous); next.delete("status"); if (value === "all") next.delete("phase"); else next.set("phase", value); return next; }, { replace: true });
  const go = (status: string, client?: string) => {
    setPhase(status);
    if (client) setF({ client, uploader: "all", q: "" });
    filesRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };
  const scoped = filterMedia(m.live, { ...f, phase: "all" });
  const list = filterMedia(m.live, { ...f, phase });
  const uploaders = [...new Set(m.live.flatMap((i) => i.uploader ? [i.uploader] : []))].sort((a, b) => (m.names[a] ?? "").localeCompare(m.names[b] ?? ""));
  const running = scoped.filter((i) => i.status !== "scheduled");
  const rows = m.clients.map((c) => {
    const mine = scoped.filter((i) => i.client_id === c.id);
    const counts = Object.fromEntries(STEPS.map((s) => [s, mine.filter((i) => i.status === s).length])) as Record<VideoStatus, number>;
    return { c, counts, total: mine.filter((i) => i.status !== "scheduled").length };
  }).filter((r) => STEPS.some((s) => r.counts[s] > 0))
    .sort((a, b) => sort.key === "name" ? a.c.name.localeCompare(b.c.name) * sort.dir : ((sort.key === "total" ? a.total - b.total : a.counts[sort.key] - b.counts[sort.key]) * sort.dir) || a.c.name.localeCompare(b.c.name));
  const sortBtn = (key: typeof sort.key, label: React.ReactNode) => (
    <Button variant="ghost" size="sm" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1 }))} className="h-auto whitespace-normal px-1 py-1 text-xs text-muted-foreground">{label}<ArrowUpDown className={cn("shrink-0", sort.key === key ? "opacity-100" : "opacity-30")} /></Button>
  );
  const actions = [
    ...clientsReadyToSend(scoped).flatMap((r) => {
      const send = scoped.filter((i) => i.client_id === r.client_id && i.status === "ready_for_client");
      const oldest = [...send].sort((a, b) => a.status_changed_at.localeCompare(b.status_changed_at))[0];
      return oldest ? [{ key: "r" + r.client_id, client: r.client_id, text: `${r.count} video's klaar om te versturen`, since: oldest.status_changed_at, to: oldest.id, send }] : [];
    }),
    ...running.filter((i) => openFb.has(i.id) || ageTone(i.status_changed_at) === "late")
      .sort((a, b) => a.status_changed_at.localeCompare(b.status_changed_at))
      .map((i) => ({ key: i.id, client: i.client_id, text: i.title, since: i.status_changed_at, to: i.id, label: openFb.has(i.id) ? "Nieuwe klantfeedback" : VIDEO_STATUS_LABEL[i.status], send: undefined })),
  ].slice(0, 10);

  return (
    <div className="min-w-0 space-y-5 p-4 md:p-6" {...up.dropProps}>
      <PageHeader title="Media" action={<PrimaryAction icon={ArrowRight} to="/hibe/pipeline">Open productieboard</PrimaryAction>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MediaTabs value="overview" />
        <Button variant="outline" onClick={up.openPicker}><Upload />Video uploaden</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={f.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Zoek bestanden" aria-label="Zoek bestanden" className="pl-9" /></div>
        <Select value={f.client} onValueChange={(client) => setF({ client })}><SelectTrigger aria-label="Filter op klant" className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle klanten</SelectItem>{m.clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={phase} onValueChange={setPhase}><SelectTrigger aria-label="Filter op fase" className="w-full sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle fases</SelectItem><SelectItem value="running">Alle lopende fases</SelectItem>{STEPS.map((s) => <SelectItem key={s} value={s}>{VIDEO_STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select>
        <Select value={f.uploader} onValueChange={(uploader) => setF({ uploader })}><SelectTrigger aria-label="Filter op uploader" className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle uploaders</SelectItem>{uploaders.map((id) => <SelectItem key={id} value={id}>{m.names[id] ?? "Onbekend"}</SelectItem>)}</SelectContent></Select>
        {(phase !== "all" || f.client !== "all" || f.uploader !== "all" || f.q) && <Button variant="ghost" size="sm" onClick={() => { setF({ client: "all", uploader: "all", q: "" }); setPhase("all"); }}>Wis filters</Button>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STEPS.map((s) => <Button variant="outline" key={s} aria-pressed={phase === s} onClick={() => go(s)} className={cn("h-28 min-w-0 flex-col items-start justify-between gap-2 whitespace-normal rounded-lg p-4 text-left", phase === s && "border-lime bg-filter-active hover:bg-filter-active")}>
          <span className="text-xs leading-4 text-muted-foreground">{VIDEO_STATUS_LABEL[s]}</span>
          <span className="text-3xl font-bold leading-none tabular">{scoped.filter((i) => i.status === s).length}</span>
        </Button>)}
      </div>
      <UploadProgress />
      <section className="min-w-0 border-b border-border pb-4">
        <h2 className="mb-2 text-base font-semibold">Per klant</h2>
        <div className="overflow-x-auto">
          {rows.length === 0 ? <p className="py-3 text-sm text-muted-foreground">{m.isLoading ? "Laden…" : "Geen bestanden gevonden."}</p> : <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 pr-3 font-medium">{sortBtn("name", "Klant")}</th>{STEPS.map((s) => <th key={s} className="px-1 py-2 text-center font-medium">{sortBtn(s, VIDEO_STATUS_LABEL[s])}</th>)}<th className="py-2 pl-2 text-right font-medium">{sortBtn("total", "Totaal lopend")}</th></tr></thead>
            <tbody className="divide-y divide-border">{rows.map(({ c, counts, total }) => <tr key={c.id}>
              <td className="py-2 pr-3"><span className="flex max-w-56 items-center gap-2">{m.mark(c.id, 24)}<span className="min-w-0 font-medium">{c.name}</span></span></td>
              {STEPS.map((s) => <td key={s} className="px-1 py-2 text-center">{counts[s] ? <Button variant="ghost" size="sm" aria-label={`${c.name}: ${counts[s]} bestanden in ${VIDEO_STATUS_LABEL[s]}`} onClick={() => go(s, c.id)} className="h-8 px-1"><Tag variant={BADGE[s]} className="min-w-8 justify-center font-semibold tabular">{counts[s]}</Tag></Button> : <span className="text-muted-foreground">—</span>}</td>)}
              <td className="py-2 pl-2 text-right">{total ? <Button variant="ghost" size="sm" aria-label={`${c.name}: alle lopende bestanden`} onClick={() => go("running", c.id)} className="h-8 px-1"><Tag className="font-semibold tabular">{total}</Tag></Button> : <span className="text-muted-foreground">—</span>}</td>
            </tr>)}</tbody>
          </table>}
        </div>
      </section>
      <section ref={filesRef} className="scroll-mt-24 min-w-0" aria-label="Bestandslijst">
        <div className="mb-2 flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">Bestanden</h2><Tag>{list.length}</Tag>{phase !== "all" && <Tag variant={phase === "running" ? "neutral" : BADGE[phase as VideoStatus]}>{phase === "running" ? "Alle lopende fases" : VIDEO_STATUS_LABEL[phase as VideoStatus]}</Tag>}</div>
        {m.isLoading ? <p className="py-4 text-sm text-muted-foreground">Laden…</p> : list.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Geen bestanden gevonden.</p> : <ul className="divide-y divide-border border-y border-border">{list.map((i) => <li key={i.id}>
          <Button asChild variant="ghost" className="h-auto w-full justify-start rounded-none px-2 py-3"><Link to={`/hibe/videos/${i.id}`} className="!no-underline">
            <VideoThumb versionId={i.versionId} className="h-12 w-8 shrink-0" />
            <span className="min-w-0 flex-1 text-left"><span className="block truncate font-semibold">{i.title}</span><span className="mt-1 block truncate text-xs font-normal text-muted-foreground">{m.clientName(i.client_id)} · {i.uploader ? m.names[i.uploader] ?? "Onbekend" : "HIBE"} · V{i.current_version}</span></span>
            <Tag variant={BADGE[i.status]} className="hidden max-w-48 whitespace-normal sm:inline-flex">{VIDEO_STATUS_LABEL[i.status]}</Tag>
            <span className="shrink-0 text-xs font-normal text-muted-foreground" title="Wachttijd in deze fase">{fmtAge(i.status_changed_at)}</span><ArrowRight />
          </Link></Button>
        </li>)}</ul>}
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="min-w-0 border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between gap-2"><h2 className="text-base font-semibold">Actie nodig</h2>{actions.length === 0 ? <Tag variant="success" icon={<Check />}>Alles is bij</Tag> : <Tag variant="warning">{actions.length}</Tag>}</div>
          {actions.length > 0 && <ul className="divide-y divide-border">{actions.map((a) => <li key={a.key} className="flex flex-wrap items-center gap-2 py-3 text-sm">
            <Button asChild variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal px-1 py-1 text-left"><Link to={`/hibe/videos/${a.to}`} className="!no-underline"><span className="min-w-0"><span className="block font-semibold">{a.text}</span><span className="mt-1 flex flex-wrap items-center gap-2"><Tag>{m.clientName(a.client)}</Tag><span className="text-xs font-normal text-muted-foreground">{"label" in a ? a.label : "Klaar voor de klant"}</span></span></span></Link></Button>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{fmtAge(a.since)}</span>
            {a.send && <Button size="sm" variant="outline" disabled={sender.busy} onClick={() => { if (a.send) sender.send(m.clientName(a.client), a.send); }}><Send />Stuur naar klant</Button>}
          </li>)}</ul>}
        </section>
        <section className="min-w-0 border-t border-border pt-4">
          <h2 className="mb-2 text-base font-semibold">Laatste activiteit</h2>
          {activity.length === 0 ? <p className="text-sm text-muted-foreground">Nog geen activiteit.</p> : <ul className="divide-y divide-border">{activity.map((a) => <li key={a.id}>
            <Button asChild variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-none px-1 py-3 font-normal"><Link to={`/hibe/videos/${a.itemId}`} className="!no-underline">
              <span className="min-w-0 flex-1 text-left"><span className="block text-sm">{a.kind === "sent" ? KIND.sent : `${a.who ? m.names[a.who] ?? (a.kind === "upload" ? "HIBE" : m.clientName(a.clientId)) : "Iemand"} ${KIND[a.kind]}`} <strong className="font-semibold">{a.title}</strong>{a.version ? ` V${a.version}` : ""}</span><Tag className="mt-1">{m.clientName(a.clientId)}</Tag></span>
              <span className="shrink-0 text-xs text-muted-foreground">{fmtAge(a.at)}{fmtAge(a.at) === "zojuist" ? "" : " geleden"}</span>
            </Link></Button>
          </li>)}</ul>}
        </section>
      </div>
      {up.ui}{sender.dialog}
    </div>
  );
}
