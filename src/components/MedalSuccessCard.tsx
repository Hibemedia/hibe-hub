import { ReactNode, useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deliverImage } from "@/lib/image-download";
import logo from "@/assets/logo.png";

type Format = "linkedin" | "story";

export function MedalSuccessCard({ title, metric, date, clientName, level, badge, videoMilestone }: { title: string; metric: string; date: string | null; clientName: string; level: number; badge: ReactNode; videoMilestone: boolean }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("linkedin");
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState(false);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let previewUrl: string | null = null;
    setImage(null);
    setError(false);
    async function render() {
      try {
        await document.fonts.ready;
        const element = card.current;
        if (!element) return;
        await Promise.all(Array.from(element.querySelectorAll("img")).map((img) => img.decode()));
        const blob = await toBlob(element, { pixelRatio: 2, cacheBust: false });
        if (!blob) throw new Error("Afbeelding niet beschikbaar");
        if (cancelled) return;
        previewUrl = URL.createObjectURL(blob);
        setImage({ blob, url: previewUrl });
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void render();
    return () => { cancelled = true; if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [open, format, title, metric, date, clientName, level]);

  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full rounded-full" onClick={() => setOpen(!open)} aria-expanded={open}><ImageIcon className="mr-2 h-4 w-4" />Succeskaart maken</Button>
      {open && <>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Afbeeldingsformaat">
          <Button variant={format === "linkedin" ? "default" : "outline"} className="h-auto min-h-10 whitespace-normal rounded-full" aria-pressed={format === "linkedin"} onClick={() => setFormat("linkedin")}>LinkedIn · 1080 × 1080</Button>
          <Button variant={format === "story" ? "default" : "outline"} className="h-auto min-h-10 whitespace-normal rounded-full" aria-pressed={format === "story"} onClick={() => setFormat("story")}>Story · 1080 × 1920</Button>
        </div>
        {image ? <img src={image.url} alt={`Succeskaart van ${clientName}: ${title}, ${metric}`} className={`mx-auto w-full rounded-md object-contain ${format === "story" ? "max-h-72" : "max-h-80"}`} /> : <div className="flex h-40 items-center justify-center bg-muted rounded-md" role="status">{error ? <p className="p-4 text-sm">De afbeelding kon niet worden gemaakt. Sluit de kaart en probeer opnieuw.</p> : <Loader2 className="h-6 w-6 animate-spin" aria-label="Afbeelding maken" />}</div>}
        <Button className="medal-share w-full rounded-full" disabled={!image} onClick={() => {
          if (!image) return;
          void deliverImage(image.blob, `hibe-succes-${format}-niveau-${level}.png`).catch(() => setError(true));
        }}><Download className="mr-2 h-4 w-4" />Download afbeelding</Button>
        <div className="success-card-render" aria-hidden="true">
          <div ref={card} className={`success-card success-card-${format}`}>
            <header className="success-card-header"><div className="success-card-logo"><img src={logo} alt="HIBE" /></div><span>MIJLPAAL BEHAALD</span></header>
            <div className="success-card-client">{clientName}</div>
            <div className="success-card-badge">{badge}</div>
            <div className="success-card-copy"><span className="success-card-level">Niveau {level} behaald</span><h2>{title}</h2><p className="success-card-metric">{metric}</p></div>
            <footer><span>{date ? `${videoMilestone ? "Video van" : "Behaald op"} ${date}` : "Een prestatie om trots op te zijn."}</span><span>SAMEN GROEIEN. SAMEN VIEREN.</span></footer>
          </div>
        </div>
      </>}
    </div>
  );
}