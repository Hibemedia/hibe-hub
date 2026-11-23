import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Play, Pause, Maximize, Airplay } from "lucide-react";
import { fmtTime } from "@/lib/videos";
import { cn } from "@/lib/utils";

export type PlayerHandle = { seek: (t: number) => void; pause: () => void; time: () => number };
type Marker = { id: string; t: number; label: string; muted?: boolean };

/** Video with timeline markers, keyboard shortcuts (space, ←, →), speed and fullscreen. */
export const Player = forwardRef<PlayerHandle, { url?: string | null; markers: Marker[]; maxH?: string; keyboard?: boolean }>(function Player({ url, markers, maxH = "calc(100vh - 220px)", keyboard = true }, ref) {
  const v = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(0), [now, setNow] = useState(0), [playing, setPlaying] = useState(false), [rate, setRate] = useState(1), [portrait, setPortrait] = useState(true), [airOk, setAirOk] = useState(false);
  useEffect(() => { const el = v.current as any; setAirOk(!!el && ("WebKitPlaybackTargetAvailabilityEvent" in window || !!el.remote)); }, [url]);
  const airplay = () => { const el = v.current as any; if (el?.webkitShowPlaybackTargetPicker) el.webkitShowPlaybackTargetPicker(); else el?.remote?.prompt().catch(() => {}); };
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
  const [drag, setDrag] = useState(false);
  const wasPlaying = useRef(false);
  const seekAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!v.current || !dur) return;
    const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
    v.current.currentTime = t;
    setNow(t); // balk direct meebewegen, niet wachten op timeupdate
  };
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    wasPlaying.current = !!v.current && !v.current.paused;
    v.current?.pause();
    setDrag(true);
    seekAt(e);
  };
  const endDrag = () => { setDrag(false); if (wasPlaying.current) v.current?.play().catch(() => {}); };
  const ctl = "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-background transition-colors hover:bg-background/20";
  return (
    <div ref={box} className="flex w-full justify-center bg-background [&:fullscreen]:items-center [&:fullscreen]:bg-foreground">
      <div className={cn("group relative overflow-hidden rounded-lg bg-foreground", portrait ? "w-auto" : "w-full")} style={{ maxWidth: "100%" }}>
        {url ? (
          <video ref={v} src={url} playsInline preload="metadata" onClick={toggle} x-webkit-airplay="allow"
            onLoadedMetadata={(e) => { const el = e.currentTarget; setDur(el.duration || 0); setPortrait(el.videoHeight >= el.videoWidth); el.playbackRate = rate; }}
            onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            className={cn("block h-auto", portrait ? "w-auto" : "w-full")} style={{ maxHeight: maxH, maxWidth: "100%" }} />
        ) : <div className="flex aspect-[9/16] items-center justify-center text-sm text-background/70" style={{ maxHeight: maxH, maxWidth: "100%" }}>Video laden…</div>}
        <div className={cn("absolute inset-x-0 bottom-0 bg-foreground/55 px-2 pb-1.5 pt-1 backdrop-blur-sm transition-opacity duration-200", playing && !drag ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100" : "opacity-100")}>
          <div className="group/tl relative h-4 cursor-pointer touch-none" aria-label="Tijdlijn"
            onPointerDown={startDrag}
            onPointerMove={(e) => { if (drag) seekAt(e); }}
            onPointerUp={endDrag} onPointerCancel={endDrag}>
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-background/30 transition-[height] group-hover/tl:h-1.5" />
            <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-lime transition-[height] group-hover/tl:h-1.5" style={{ width: pct(now) }} />
            <div className={cn("absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime transition-opacity", drag ? "opacity-100" : "opacity-0 group-hover/tl:opacity-100")} style={{ left: pct(now) }} />
            {markers.map((mk) => (
              <button key={mk.id} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (v.current) { v.current.currentTime = mk.t; v.current.pause(); } }} title={`${mk.label} · ${fmtTime(mk.t)}`} aria-label={`Opmerking ${mk.label} op ${fmtTime(mk.t)}`}
                className={cn("absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-foreground/60", mk.muted ? "bg-background/60" : "bg-background")} style={{ left: pct(mk.t) }} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggle} aria-label={playing ? "Pauzeren" : "Afspelen"} className={ctl}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
            <span className="flex-1 truncate text-xs tabular text-background/90">{fmtTime(now)} / {fmtTime(dur)}</span>
            <select aria-label="Snelheid" value={rate} onChange={(e) => { const r = Number(e.target.value); setRate(r); if (v.current) v.current.playbackRate = r; }} className="h-7 rounded-md border-0 bg-transparent px-1 text-xs text-background hover:bg-background/20 [&>option]:text-foreground">
              {[0.5, 1, 1.5, 2].map((r) => <option key={r} value={r}>{String(r).replace(".", ",")}x</option>)}
            </select>
            {airOk && <button aria-label="AirPlay" title="Afspelen op Apple TV" onClick={airplay} className={ctl}><Airplay className="h-4 w-4" /></button>}
            <button aria-label="Volledig scherm" onClick={() => {
              if (document.fullscreenElement) { document.exitFullscreen(); return; }
              const video = v.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
              if (box.current?.requestFullscreen) box.current.requestFullscreen().catch(() => video?.webkitEnterFullscreen?.());
              else video?.webkitEnterFullscreen?.(); // iPhone-Safari kent alleen fullscreen op de video zelf
            }} className={ctl}><Maximize className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
});
