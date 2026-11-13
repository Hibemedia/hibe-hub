import { Tag } from "@/components/ui/tag";
import { useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls } from "@/hooks/useLogoUrl";
import { usePlayUrl } from "@/hooks/useVideos";
import { VIDEO_STATUS_LABEL, VideoStatus, clientColorSlot } from "@/lib/videos";
import { cn } from "@/lib/utils";

const LETTER = [
  "bg-[hsl(var(--social-orange-bg))] text-[hsl(var(--social-orange-fg))]",
  "bg-[hsl(var(--social-blue-bg))] text-[hsl(var(--social-blue-fg))]",
  "bg-[hsl(var(--social-green-bg))] text-[hsl(var(--social-green-fg))]",
  "bg-[hsl(var(--social-purple-bg))] text-[hsl(var(--social-purple-fg))]",
  "bg-[hsl(var(--social-cyan-bg))] text-[hsl(var(--social-cyan-fg))]",
  "bg-[hsl(var(--social-amber-bg))] text-[hsl(var(--social-amber-fg))]",
];

/** Signed logo URLs for all clients, keyed by client id. */
export function useClientLogos() {
  const { clients } = useClient();
  const urls = useLogoUrls(clients.map((c) => c.logo_url));
  const m: Record<string, string | undefined> = {};
  for (const c of clients) m[c.id] = c.logo_url ? urls[c.logo_url] : undefined;
  return m;
}

export function ClientMark({ id, name, url, size = 28, className }: { id: string; name: string; url?: string; size?: number; className?: string }) {
  if (url) return <img src={url} alt="" className={cn("shrink-0 rounded-full bg-popover object-cover", className)} style={{ width: size, height: size }} />;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", LETTER[clientColorSlot(id)], className)}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.45) }} aria-hidden>{name.slice(0, 1).toUpperCase()}</span>
  );
}

export function StatusLabel({ status, label, className }: { status: VideoStatus; label?: string; className?: string }) {
  return <Tag className={className} variant={status === "approved_client" || status === "approved_internal" || status === "scheduled" ? "success" : status === "feedback" ? "warning" : status === "client_review" || status === "internal_review" ? "info" : "neutral"}>{label ?? VIDEO_STATUS_LABEL[status]}</Tag>;
}

/** First frame of the latest version, loaded only when scrolled into view. */
export function VideoThumb({ versionId, className, logo }: { versionId: string | null; className?: string; logo?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  const { data: url } = usePlayUrl(seen && versionId ? versionId : undefined);
  return (
    <div ref={ref} className={cn("relative shrink-0 overflow-hidden rounded-md bg-foreground", className)}>
      {url ? <video src={`${url}#t=0.5`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
        : <div className="flex h-full w-full items-center justify-center text-background/60"><Film className="h-4 w-4" strokeWidth={1.4} /></div>}
      {logo && <span className="absolute left-1 top-1">{logo}</span>}
    </div>
  );
}
