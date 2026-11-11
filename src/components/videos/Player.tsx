import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Play, Pause, Maximize } from "lucide-react";
import { fmtTime } from "@/lib/videos";
import { cn } from "@/lib/utils";

export type PlayerHandle = { seek: (t: number) => void; pause: () => void; time: () => number };
type Marker = { id: string; t: number; label: string; muted?: boolean };

/** Video with timeline markers, keyboard shortcuts (space, ←, →), speed and fullscreen. */
export const Player = forwardRef<PlayerHandle, { url?: string | null; markers: Marker[]; maxH?: string; keyboard?: boolean }>(function Player({ url, markers, maxH = "calc(100vh - 220px)", keyboard = true }, ref) {
  const v = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(0), [now, setNow] = useState(0), [playing, setPlaying] = useState(false), [rate, setRate] = useState(1), [portrait, setPortrait] = useState(true);
  useImperativeHandle(ref, () => ({ seek: (t) => { if (v.current) { v.current.currentTime = t; v.current.pause(); } }, pause: () => v.current?.pause(), time: () => v.current?.currentTime ?? 0 }));
  useEffect(() => {
    if (!keyboard) return;
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select,[contenteditable=true],[role=menu],[role=listbox]") || !v.current) return;
      if (e.code === "Space") { e.preventDefault(); v.current.paused ? v.current.play() : v.current.pause(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); v.current.currentTime = Math.max(0, v.current.currentTime - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); v.current.currentTime = Math.min(dur, v.current.currentTime + 1); }
    };
    window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on);
  }, [keyboard, dur]);
  const pct = (t: number) => `${dur ? Math.min(100, (t / dur) * 100) : 0}%`;
  const toggle = () => { const el = v.current; if (el) el.paused ? el.play() : el.pause(); };
  return (
    <div ref={box} className="flex w-full flex-col items-center gap-2 bg-background [&:fullscreen]:justify-center [&:fullscreen]:bg-foreground">
      <div className="flex w-full justify-center">
        {url ? (
          <video ref={v} src={url} playsInline preload="metadata" onClick={toggle}
            onLoadedMetadata={(e) => { const el = e.currentTarget; setDur(el.duration || 0); setPortrait(el.videoHeight >= el.videoWidth); el.playbackRate = rate; }}
            onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            className={cn("rounded-lg bg-foreground", portrait ? "w-auto max-w-full" : "w-full")} style={portrait ? { height: maxH, maxHeight: maxH } : { maxHeight: maxH }} />
        ) : <div className="flex aspect-[9/16] items-center justify-center rounded-lg bg-foreground text-sm text-background/70" style={{ height: maxH }}>Video laden…</div>}
      </div>
      <div className="flex w-full max-w-2xl items-center gap-2 px-1">
        <button onClick={toggle} aria-label={playing ? "Pauzeren" : "Afspelen"} className="round-btn h-9 w-9 shrink-0">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
        <span className="w-20 shrink-0 text-xs tabular text-muted-foreground">{fmtTime(now)} / {fmtTime(dur)}</span>
        <div className="relative h-6 flex-1 cursor-pointer" aria-label="Tijdlijn" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); if (v.current && dur) v.current.currentTime = ((e.clientX - r.left) / r.width) * dur; }}>
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
          <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground" style={{ width: pct(now) }} />
          {markers.map((mk) => (
            <button key={mk.id} onClick={(e) => { e.stopPropagation(); if (v.current) { v.current.currentTime = mk.t; v.current.pause(); } }} title={`${mk.label} · ${fmtTime(mk.t)}`} aria-label={`Opmerking ${mk.label} op ${fmtTime(mk.t)}`}
              className={cn("absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background", mk.muted ? "bg-muted-foreground/50" : "bg-lime")} style={{ left: pct(mk.t) }} />
          ))}
        </div>
        <select aria-label="Snelheid" value={rate} onChange={(e) => { const r = Number(e.target.value); setRate(r); if (v.current) v.current.playbackRate = r; }} className="h-8 rounded-md border border-border bg-popover px-1 text-xs">
          {[0.5, 1, 1.5, 2].map((r) => <option key={r} value={r}>{String(r).replace(".", ",")}x</option>)}
        </select>
        <button aria-label="Volledig scherm" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen())} className="round-btn h-9 w-9 shrink-0"><Maximize className="h-4 w-4" /></button>
      </div>
    </div>
  );
});
