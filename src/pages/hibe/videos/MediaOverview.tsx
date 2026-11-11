import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Upload, Send, ArrowUpDown } from "lucide-react";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { useMedia, useSavedFilters, useUploader } from "@/components/videos/useMedia";
import { useSendToClient } from "@/components/videos/SendDialog";
import { UploadProgress } from "@/components/UploadProgress";
import { useVideoActivity, useOpenClientFeedback } from "@/hooks/useVideos";
import { STEPS, STEP_SLUG, VIDEO_STATUS_LABEL, VideoStatus, worstTone, ageTone, fmtAge, clientsReadyToSend } from "@/lib/videos";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tone = { ok: "", warn: "border-warning text-warning", late: "border-destructive text-destructive" };
const KIND = { upload: "uploadde", approved: "keurde goed", feedback: "gaf feedback op", sent: "Verstuurd naar klant:" };

export default function MediaOverview() {
  const [params] = useSearchParams();
  const m = useMedia();
  const nav = useNavigate();
  const [, setF] = useSavedFilters();
  const up = useUploader();
  const sender = useSendToClient();
  const { data: activity = [] } = useVideoActivity(m.live);
  const { data: openFb = new Set<string>() } = useOpenClientFeedback();
  const [sort, setSort] = useState<{ key: VideoStatus | "total" | "name"; dir: 1 | -1 }>({ key: "total", dir: -1 });
  const running = m.live.filter((i) => i.status !== "scheduled");
  const go = (s: VideoStatus, client?: string) => { setF({ client: client ?? "all", uploader: "all", q: "" }); nav(`/hibe/videos/stap/${STEP_SLUG[s]}`); };

  const rows = m.clients.map((c) => {
    const mine = m.live.filter((i) => i.client_id === c.id);
    const counts = Object.fromEntries(STEPS.map((s) => [s, mine.filter((i) => i.status === s).length])) as Record<VideoStatus, number>;
    return { c, counts, total: mine.filter((i) => i.status !== "scheduled").length };
  }).filter((r) => STEPS.some((s) => r.counts[s] > 0))
    .sort((a, b) => sort.key === "name" ? a.c.name.localeCompare(b.c.name) * sort.dir : ((sort.key === "total" ? a.total - b.total : a.counts[sort.key] - b.counts[sort.key]) * sort.dir) || a.c.name.localeCompare(b.c.name));
  const sortBtn = (key: typeof sort.key, label: React.ReactNode) => (
    <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1 }))} className="inline-flex items-center gap-1 hover:text-foreground">{label}<ArrowUpDown className={cn("h-3 w-3", sort.key === key ? "opacity-100" : "opacity-30")} /></button>
  );

  const actions = [
    ...clientsReadyToSend(m.live).map((r) => ({ key: "r" + r.client_id, client: r.client_id, text: `${r.count} video's klaar om te versturen`, send: m.live.filter((i) => i.client_id === r.client_id && i.status === "ready_for_client") })),
    ...m.live.filter((i) => i.status === "feedback" && openFb.has(i.id)).map((i) => ({ key: "f" + i.id, client: i.client_id, text: `Nieuwe feedback op "${i.title}"`, to: i.id })),
    ...running.filter((i) => ageTone(i.status_changed_at) === "late").map((i) => ({ key: "o" + i.id, client: i.client_id, text: `"${i.title}" staat al ${fmtAge(i.status_changed_at)} in ${VIDEO_STATUS_LABEL[i.status]}`, to: i.id })),
  ].slice(0, 10) as { key: string; client: string; text: string; to?: string; send?: typeof m.live }[];

  const legacy = params.get("status") as VideoStatus | null;
  if (legacy && STEP_SLUG[legacy]) return <Navigate to={`/hibe/videos/stap/${STEP_SLUG[legacy]}`} replace />;
  return (
    <div className="space-y-5 p-4 md:p-8" {...up.dropProps}>
      <PageHeader title="Media Management" action={<PrimaryAction icon={Upload} onClick={up.openPicker}>Video uploaden</PrimaryAction>} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {STEPS.map((s) => {
          const inStep = m.live.filter((i) => i.status === s);
          const t = s === "scheduled" ? "ok" : worstTone(inStep.map((i) => i.status_changed_at));
          return (
            <button key={s} onClick={() => go(s)} className={cn("flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-popover", tone[t])}>
              <span className="text-xs text-muted-foreground">{VIDEO_STATUS_LABEL[s]}</span>
              <span className="text-3xl font-light leading-none tabular">{inStep.length}</span>
            </button>
          );
        })}
      </div>
      <UploadProgress />

      <section className="rounded-lg border border-border bg-card">
        <h2 className="px-4 pt-4 text-base font-semibold">Per klant</h2>
        <div className="overflow-x-auto p-2">
          {rows.length === 0 ? <p className="p-3 text-sm text-muted-foreground">{m.isLoading ? "Laden…" : "Nog geen lopende video's. Upload een video om te beginnen."}</p> : (
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">
                <th className="px-2 py-2 font-medium">{sortBtn("name", "Klant")}</th>
                {STEPS.map((s) => <th key={s} className="px-2 py-2 text-center font-medium" title={VIDEO_STATUS_LABEL[s]}>{sortBtn(s, <span className="text-left leading-tight">{VIDEO_STATUS_LABEL[s]}</span>)}</th>)}
                <th className="px-2 py-2 text-right font-medium">{sortBtn("total", "Totaal lopend")}</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ c, counts, total }) => (
                  <tr key={c.id}>
                    <td className="px-2 py-2"><span className="flex items-center gap-2">{m.mark(c.id, 24)}<span className="truncate font-medium">{c.name}</span></span></td>
                    {STEPS.map((s) => <td key={s} className="p-0 text-center">{counts[s] > 0 && <button onClick={() => go(s, c.id)} className="h-9 w-full tabular hover:bg-muted">{counts[s]}</button>}</td>)}
                    <td className="px-2 py-2 text-right font-semibold tabular">{total || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-base font-semibold">Actie nodig</h2>
          {actions.length === 0 ? <p className="text-sm text-muted-foreground">Alles is bij. Hier verschijnen setjes om te versturen, nieuwe klantfeedback en video's die blijven hangen.</p> : (
            <ul className="divide-y divide-border">
              {actions.map((a) => (
                <li key={a.key} className="flex items-center gap-3 py-2 text-sm">
                  {m.mark(a.client, 24)}
                  {a.to ? <Link to={`/hibe/videos/${a.to}`} className="min-w-0 flex-1 truncate hover:underline">{m.clientName(a.client)} · {a.text}</Link> : <span className="min-w-0 flex-1 truncate">{m.clientName(a.client)} · {a.text}</span>}
                  {a.send && <Button size="sm" disabled={sender.busy} onClick={() => sender.send(m.clientName(a.client), a.send!)}><Send />Stuur naar klant</Button>}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-base font-semibold">Laatste activiteit</h2>
          {activity.length === 0 ? <p className="text-sm text-muted-foreground">Nog geen activiteit.</p> : (
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                  {m.mark(a.clientId, 24)}
                  <Link to={`/hibe/videos/${a.itemId}`} className="min-w-0 flex-1 truncate hover:underline">
                    {a.kind === "sent" ? <>{KIND.sent} <b>{a.title}</b></> : <><b>{a.who ? m.names[a.who] ?? (a.kind === "upload" ? "HIBE" : m.clientName(a.clientId)) : "Iemand"}</b> {KIND[a.kind]} <b>{a.title}</b>{a.version ? ` V${a.version}` : ""}</>}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtAge(a.at)}{fmtAge(a.at) === "zojuist" ? "" : " geleden"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {up.ui}{sender.dialog}
    </div>
  );
}
