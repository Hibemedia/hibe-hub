import hibbyAvatar from "@/assets/hibby_avatar.png.asset.json";
import hibbyAvatarBlink from "@/assets/hibby_avatar_blink.png.asset.json";
import hibbyAvatarThink from "@/assets/hibby_avatar_think.png.asset.json";
import { cn } from "@/lib/utils";

/** Hibby's profile photo: the mascot head on a light disc, used everywhere Hibby appears.
 *  The blink layer crossfades in briefly every few seconds so Hibby blinks.
 *  With `thinking` Hibby shows his questioning face instead, while he is figuring something out. */
export function HibbyAvatar({ size = 32, className, thinking = false }: { size?: number; className?: string; thinking?: boolean }) {
  const face = (src: string, cls: string) => (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      aria-hidden
      className={cn("absolute inset-0 rounded-full object-cover", cls)}
      style={{ width: size, height: size }}
    />
  );

  return (
    <span
      className={cn("relative inline-block shrink-0 select-none rounded-full", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Hibby"
    >
      {face(hibbyAvatar.url, "")}
      {thinking ? face(hibbyAvatarThink.url, "hibby-think") : face(hibbyAvatarBlink.url, "hibby-blink")}
    </span>
  );
}
