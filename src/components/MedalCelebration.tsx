import { useState } from "react";
import confetti from "canvas-confetti";
import { Copy, Eye, Flame, LockKeyhole, PartyPopper, Play, Rocket, RotateCcw, Sparkle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Medal } from "@/lib/medals";
import { MEDAL_TIER_LABELS, medalMaterial } from "@/lib/medal-celebrations";

export function fireMedalConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const styles = getComputedStyle(document.documentElement);
  const colorContext = document.createElement("canvas").getContext("2d");
  if (!colorContext) return;
  // canvas-confetti expects hex, so resolve the semantic HSL palette first.
  const colors = ["--medal-lime", "--medal-gold", "--medal-bronze", "--medal-diamond", "--medal-silver"].map((token) => {
    colorContext.fillStyle = `hsl(${styles.getPropertyValue(token).trim()})`;
    return colorContext.fillStyle;
  });
  const options = { colors, particleCount: 100, spread: 95, startVelocity: 48, gravity: 1, ticks: 230, zIndex: 100, disableForReducedMotion: true };
  void confetti({ ...options, angle: 60, origin: { x: 0.1, y: 0.65 } });
  void confetti({ ...options, angle: 120, origin: { x: 0.9, y: 0.65 } });
}

const CATEGORY_ICONS = { biggestVideo: Play, totalFollowers: Users, totalViews: Eye, videosOver10k: Rocket, streakWeeks: Flame };

export function MedalBadge({ levelIndex, category, large = false, locked = false }: { levelIndex: number; category: Medal["key"]; large?: boolean; locked?: boolean }) {
  const material = medalMaterial(levelIndex);
  const CategoryIcon = CATEGORY_ICONS[category];
  return (
    <div className={`medal-collectible medal-${material} ${large ? "medal-collectible-large" : ""} ${locked ? "medal-collectible-locked" : ""}`} role="img" aria-label={`${MEDAL_TIER_LABELS[material]} medaille niveau ${levelIndex + 1}${locked ? ", nog te behalen" : ""}`}>
      <div className={`medal-badge ${large ? "medal-badge-large" : ""}`}>
        <div className="medal-badge-inner"><CategoryIcon aria-hidden className="medal-category-icon" strokeWidth={1.7} /><span className="medal-level tabular">{levelIndex + 1}</span></div>
        {material === "diamond" && <><Sparkle aria-hidden className="medal-sparkle medal-sparkle-top" /><Sparkle aria-hidden className="medal-sparkle medal-sparkle-bottom" /></>}
        {locked && <LockKeyhole aria-hidden className="medal-lock" />}
      </div>
      {!locked && <span className="medal-tier-ribbon">{MEDAL_TIER_LABELS[material]}</span>}
    </div>
  );
}

export function MedalCelebration({ medal, title, metric, date, onClose }: { medal: Medal | null; title: string; metric: string; date: string | null; onClose: () => void }) {
  const [shareState, setShareState] = useState<"idle" | "copied" | "manual">("idle");
  const text = medal ? `🎉 Een mijlpaal om te vieren! ${title}: niveau ${medal.levelIndex + 1} behaald met ${metric}.${date && !medal.achievedVideo ? ` Mijlpaal: ${date}.` : ""} Op naar het volgende succes! #HIBE #Mijlpaal` : "";

  async function share() {
    try {
      await navigator.clipboard.writeText(text);
      setShareState("copied");
    } catch {
      setShareState("manual");
    }
  }

  return (
    <Dialog open={!!medal} onOpenChange={(open) => { if (!open) { setShareState("idle"); onClose(); } }}>
      <DialogContent className="medal-celebration max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto text-center sm:max-w-md">
        {medal && <>
          <div className="mx-auto pb-2 pt-5"><MedalBadge levelIndex={medal.levelIndex} category={medal.key} large /></div>
          <span className="mx-auto growth">Niveau {medal.levelIndex + 1} behaald</span>
          <DialogTitle className="text-3xl leading-tight">{title}</DialogTitle>
          <DialogDescription className="text-base">Een prestatie om trots op te zijn.</DialogDescription>
          <p className="break-words text-3xl font-semibold tabular">{metric}</p>
          <p className="text-sm text-muted-foreground">{date ? `${medal.achievedVideo ? "Publicatiedatum mijlpaalvideo" : "Mijlpaaldatum"}: ${date}` : "Mijlpaaldatum niet beschikbaar"}</p>
          {medal.achievedVideo && <p className="line-clamp-2 text-sm">{medal.achievedVideo.title || "Zonder titel"}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="outline" className="rounded-full" onClick={fireMedalConfetti}><RotateCcw className="mr-2 h-4 w-4" />Nog een keer</Button>
            <Button className="medal-share rounded-full" onClick={share}><Copy className="mr-2 h-4 w-4" />{shareState === "copied" ? "Gekopieerd!" : "Deel succes"}</Button>
          </div>
          {shareState !== "idle" && <div className="space-y-2 text-left" aria-live="polite">
            <p className="text-sm text-muted-foreground">{shareState === "copied" ? "De tekst staat klaar voor je LinkedIn-post of Instagram Story." : "Kopiëren lukt hier niet. Selecteer de tekst hieronder."}</p>
            <textarea aria-label="Deeltekst" readOnly value={text} onFocus={(event) => event.target.select()} className="min-h-28 w-full resize-none rounded-md bg-muted p-3 text-sm text-foreground" />
          </div>}
          <PartyPopper className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
        </>}
      </DialogContent>
    </Dialog>
  );
}